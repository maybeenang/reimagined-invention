import express, { Request, Response } from 'express';
import { scrapeDetailKelas, scrapeDosen, scrapeFakultas, scrapeFakultasDanProdi, scrapeKelas, scrapeKelasByTahunAjaran, scrapeProdi, scrapeTahunAjaran } from './utils/scrapper';

const app = express();
const port = 3000;

app.get('/', (req: Request, res: Response) => {
    res.json(
        {
            message: "Hello World",
        }
    )
});

app.get('/prodi', async (req: Request, res: Response) => {
    const data = await scrapeProdi()
    res.json(
        {
            data
        }
    )
});

app.get('/fakultas', async (req: Request, res: Response) => {
    const data = await scrapeFakultas()
    res.json(
        {
            data
        }
    )
});

app.get('/fakultas-prodi', async (req: Request, res: Response) => {
    const data = await scrapeFakultasDanProdi()
    res.json(
        {
            data
        }
    )
});


app.get('/tahun-ajaran/:id', async (req: Request, res: Response) => {
    const data = await scrapeKelasByTahunAjaran(req.params.id)
    res.json(
        {
            data
        }
    )
});

app.get('/tahun-ajaran', async (req: Request, res: Response) => {
    const data = await scrapeTahunAjaran()
    res.json(
        {
            data
        }
    )
});


app.get('/dosen', async (req: Request, res: Response) => {
    const data = await scrapeDosen()
    res.json(
        {
            data
        }
    )
});

app.get('/kelas/:id', async (req: Request, res: Response) => {
    const data = await scrapeDetailKelas(req.params.id)
    res.json(
        {
            data
        }
    )
});

app.get('/kelas', async (req: Request, res: Response) => {
    const data = await scrapeKelas()
    res.json(
        {
            data
        }
    )
});



app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
