const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 3300;

const ROOT_DIR = '/home/david/code/home/reverseproxy';

async function getCfgFiles(dir, fileList = []) {
    console.log(`Scanning directory: ${dir}`);
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
    return fileList;
}

app.get('/api/cfgfiles', async (req, res) => {
    try {
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

app.post('/api/save/:filename', express.text(), async (req, res) => {
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

app.use(express.static('public'));

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
