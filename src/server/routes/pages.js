const express = require('express');
const router = express.Router();
const { getPages } = require('../utils/fileReader');

router.get('/', (req, res) => {
    const pages = getPages();
    res.render('index', { pages });
});

router.get('/:page', (req, res) => {
    const pageName = req.params.page;
    res.sendFile(`${pageName}.html`, { root: 'src/public/pages' });
});

module.exports = router;
