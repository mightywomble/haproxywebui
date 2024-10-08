const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const config = require('./config');

const app = express();

let ROOT_DIR = config.ROOT_DIR;
let CONF_D_DIR = config.CONF_D_DIR;

async function validateDirectories() {
    try {
        await fs.access(ROOT_DIR, fs.constants.R_OK);
        await fs.access(CONF_D_DIR, fs.constants.R_OK);
        console.log('Directories validated successfully');
    } catch (error) {
        console.error('Directory validation failed:', error);
        process.exit(1);
    }
}

async function getCfgFiles(dir, fileList = []) {
    console.log(`Scanning directory: ${dir}`);
    try {
        const files = await fs.readdir(dir);
        console.log(`Files in ${dir}:`, files);
        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = await fs.stat(filePath);
            if (stat.isDirectory()) {
                await getCfgFiles(filePath, fileList);
            } else if (path.extname(file) === '.cfg') {
                console.log(`Found .cfg file: ${filePath}`);
                fileList.push(path.relative(ROOT_DIR, filePath));
            }
        }
    } catch (error) {
        console.error(`Error scanning directory ${dir}:`, error);
    }
    return fileList;
}

app.use(express.json());
app.use(express.text());
app.use(express.static('public'));

app.get('/api/cfgfiles', async (req, res) => {
    try {
        console.log('Fetching cfg files...');
        const files = await getCfgFiles(ROOT_DIR);
        console.log('Found files:', files);
        if (files.length === 0) {
            console.log('No .cfg files found');
            return res.status(404).json({ message: 'No configuration files found' });
        }
        res.json(files);
    } catch (error) {
        console.error('Error reading directory:', error);
        res.status(500).json({ error: 'Error reading directory: ' + error.message });
    }
});

app.get('/api/file/:filename', async (req, res) => {
    const filePath = path.join(ROOT_DIR, req.params.filename);
    try {
        await fs.access(filePath, fs.constants.R_OK);
        const content = await fs.readFile(filePath, 'utf8');
        res.send(content);
    } catch (error) {
        console.error('Error reading file:', error);
        if (error.code === 'ENOENT') {
            res.status(404).send('File not found: ' + error.message);
        } else {
            res.status(500).send('Error reading file: ' + error.message);
        }
    }
});

app.post('/api/save/:filename', async (req, res) => {
    const filePath = path.join(ROOT_DIR, req.params.filename);
    console.log('Attempting to save file:', filePath);
    console.log('File content:', req.body);
    try {
        await fs.access(path.dirname(filePath), fs.constants.W_OK);
        await fs.writeFile(filePath, req.body);
        console.log('File saved successfully:', filePath);
        res.send('File saved successfully');
    } catch (error) {
        console.error('Error saving file:', error);
        console.error('Error details:', {
            code: error.code,
            message: error.message,
            stack: error.stack
        });

        if (error.code === 'ENOENT') {
            res.status(404).send(`Error saving file: Directory not found - ${error.message}`);
        } else if (error.code === 'EACCES') {
            res.status(403).send(`Error saving file: Permission denied - ${error.message}`);
        } else {
            res.status(500).send(`Error saving file: ${error.message}`);
        }
    }
});

app.post('/api/testconfig', (req, res) => {
    const filename = req.body.filename;
    const filePath = path.join(ROOT_DIR, filename);
    console.log(`Testing configuration file: ${filePath}`);
    exec(`haproxy -f ${filePath} -f ${CONF_D_DIR} -c`, (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return res.status(500).send(`Error testing config: ${stderr}`);
        }
        console.log('Configuration test output:', stdout);
        res.send(stdout || stderr || 'Configuration test passed');
    });
});

app.get('/api/settings', (req, res) => {
    res.json({
        haproxyPath: ROOT_DIR,
        confdPath: CONF_D_DIR
    });
});

app.post('/api/settings', async (req, res) => {
    const { haproxyPath, confdPath } = req.body;
    ROOT_DIR = haproxyPath;
    CONF_D_DIR = confdPath;
    const updatedConfig = `module.exports = {
    ROOT_DIR: '${haproxyPath}',
    CONF_D_DIR: '${confdPath}',
    PORT: ${config.PORT}
};`;
    try {
        await fs.writeFile('./config.js', updatedConfig, 'utf8');
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating config file:', error);
        res.status(500).json({ error: 'Failed to update configuration' });
    }
});

app.post('/api/template', async (req, res) => {
    console.log('Received template data:', req.body);
    const { name, content } = req.body;
    const filePath = path.join(ROOT_DIR, `${name}.cfg`);

    console.log('Attempting to create template:', filePath);
    try {
        await fs.writeFile(filePath, content);
        console.log('Template created successfully:', filePath);
        res.json({ success: true, message: 'Template created successfully' });
    } catch (error) {
        console.error('Error creating template:', error);
        console.error('Error details:', {
            code: error.code,
            message: error.message,
            stack: error.stack
        });
        res.status(500).json({ success: false, error: `Error creating template: ${error.message}` });
    }
});

app.post('/api/addservice', async (req, res) => {
    console.log('Received service data:', req.body);
    const { serviceName, internalIP, internalPort, publicURL } = req.body;
    
    try {
        // Create backend configuration
        const backendConfig = `
backend ${serviceName}_backend
    mode  http
    balance roundrobin
    option forwardfor
    http-reuse safe
    server ${serviceName}_server ${internalIP}:${internalPort} check inter 5s fall 3 rise 2
    timeout connect 10s
    timeout server 30s
    retries 3
`;
        const backendFilePath = path.join(CONF_D_DIR, `${serviceName}.cfg`);
        await fs.writeFile(backendFilePath, backendConfig);
        
        // Update frontend configuration
        const frontendFilePath = path.join(CONF_D_DIR, '00-frontend.cfg');
        let frontendContent = await fs.readFile(frontendFilePath, 'utf8');
        
        // Add ACL line
        const aclLine = `    acl host_${serviceName} hdr(host) -i ${publicURL}`;
        frontendContent = frontendContent.replace(
            /# ACLs to match hostnames/,
            `# ACLs to match hostnames\n${aclLine}`
        );
        
        // Add use_backend line
        const useBackendLine = `    use_backend ${serviceName}_backend if host_${serviceName}`;
        frontendContent = frontendContent.replace(
            /# Use backends based on hostname/,
            `# Use backends based on hostname\n${useBackendLine}`
        );
        
        await fs.writeFile(frontendFilePath, frontendContent);
        
        console.log('Service added successfully:', backendFilePath);
        console.log('Frontend configuration updated:', frontendFilePath);
        res.json({ success: true, message: 'Service added successfully' });
    } catch (error) {
        console.error('Error adding service:', error);
        console.error('Error details:', {
            code: error.code,
            message: error.message,
            stack: error.stack
        });
        res.status(500).json({ success: false, error: `Error adding service: ${error.message}` });
    }
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something broke!', details: err.message });
});

const PORT = config.PORT || 3300;

validateDirectories().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}).catch(error => {
    console.error('Failed to start server:', error);
});
