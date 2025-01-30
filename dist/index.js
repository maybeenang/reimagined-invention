"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const scrapper_1 = require("./utils/scrapper");
const app = (0, express_1.default)();
const port = 3000;
app.get('/', (req, res) => {
    res.json({
        message: "Hello World",
    });
});
app.get('/prodi', async (req, res) => {
    const data = await (0, scrapper_1.scrapeProdi)();
    res.json({
        data
    });
});
app.get('/fakultas', async (req, res) => {
    const data = await (0, scrapper_1.scrapeFakultas)();
    res.json({
        data
    });
});
app.get('/fakultas-prodi', async (req, res) => {
    const data = await (0, scrapper_1.scrapeFakultasDanProdi)();
    res.json({
        data
    });
});
app.get('/tahun-ajaran/:id', async (req, res) => {
    const data = await (0, scrapper_1.scrapeKelasByTahunAjaran)(req.params.id);
    res.json({
        data
    });
});
app.get('/tahun-ajaran', async (req, res) => {
    const data = await (0, scrapper_1.scrapeTahunAjaran)();
    res.json({
        data
    });
});
app.get('/dosen', async (req, res) => {
    const data = await (0, scrapper_1.scrapeDosen)();
    res.json({
        data
    });
});
app.get('/kelas/:id', async (req, res) => {
    const data = await (0, scrapper_1.scrapeDetailKelas)(req.params.id);
    res.json({
        data
    });
});
app.get('/kelas', async (req, res) => {
    const data = await (0, scrapper_1.scrapeKelas)();
    res.json({
        data
    });
});
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
