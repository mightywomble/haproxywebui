const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');

const app = express();
const PORT = 3300;

let ROOT_DIR = '/home/david/code/home/reverseproxy';
let CONF_D_DIR = '/home/david/code/home/reverseproxy/conf.d';

async function getCfgFiles(dir, fileList = []) {
    console.log(`Scanning directory: ${dir}`);
    try {
        const files = await fs.readdir(dir);
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

app.get('/api/cfgfiles', async (req, res) => {
    try {
        console.log('Fetching cfg files...');
        const files = await getCfgFiles(ROOT_DIR);
        console.log('Found files:', files);
        res.json(files);
    } catch (error) {
        console.error('Error reading directory:', error);
        res.status(500).json({ error: 'Error reading directory: ' + error.message });
    }
});

app.get('/api/file/:filename', async (req, res) => {
    const filePath = path.join(ROOT_DIR, req.params.filename);
    try {
        const content = await fs.readFile(filePath, 'utf8');
        res.send(content);
    } catch (error) {
        console.error('Error reading file:', error);
        res.status(404).send('File not found: ' + error.message);
    }
});

app.post('/api/save/:filename', async (req, res) => {
    const filePath = path.join(ROOT_DIR, req.params.filename);
    console.log('Attempting to save file:', filePath);
    try {
        await fs.writeFile(filePath, req.body);
        res.send('File saved successfully');
    } catch (error) {
        console.error('Error saving file:', error);
        res.status(500).send(`Error saving file: ${error.message}`);
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

app.post('/api/settings', (req, res) => {
    const { haproxyPath, confdPath } = req.body;
    ROOT_DIR = haproxyPath;
    CONF_D_DIR = confdPath;
    res.json({ success: true });
});

app.use(express.static('public'));

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
