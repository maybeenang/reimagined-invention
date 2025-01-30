import express, { Request, Response } from 'express';
import { scrapeBulkDetailKelas, scrapeDetailKelas, scrapeDosen, scrapeFakultas, scrapeFakultasDanProdi, scrapeKelas, scrapeKelasByTahunAjaran, scrapeProdi, scrapeTahunAjaran } from './utils/scrapper';

const app = express();
const port = 3000;

app.use(express.json())

app.get('/', (req: Request, res: Response) => {
    res.json(
        {
            message: "Hello World",
        }
    )
});

app.get('/prodi', async (req: Request, res: Response) => {

    try {

        const data = await scrapeProdi()
        res.json(
            {
                data
            }
        )
    } catch (error) {

        res.json(
            {
                error
            }
        )

    }

});

app.get('/fakultas', async (req: Request, res: Response) => {
    try {

        const data = await scrapeFakultas()
        res.json(
            {
                data
            }
        )
    } catch (error) {

        res.json(
            {
                error
            }
        )


    }
});

app.get('/fakultas-prodi', async (req: Request, res: Response) => {
    try {

        const data = await scrapeFakultasDanProdi()
        res.json(
            {
                data
            }
        )
    } catch (error) {

        res.json(
            {
                error
            }
        )

    }
});


app.get('/tahun-ajaran/:id', async (req: Request, res: Response) => {
    try {

        const data = await scrapeKelasByTahunAjaran(req.params.id)
        res.json(
            {
                data
            }
        )
    } catch (error) {

        res.json(
            {
                error
            }
        )

    }
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
    try {
        const data = await scrapeDetailKelas(req.params.id)
        res.json(
            {
                data
            }
        )
    } catch (error) {

        res.json(
            {
                error
            }
        )

    }
});

app.get('/kelas', async (req: Request, res: Response) => {
    const data = await scrapeKelas()
    res.json(
        {
            data
        }
    )
});

app.post('/kelas', async (req: Request, res: Response) => {
    try {

        const data = await scrapeBulkDetailKelas(req.body.ids)
        return res.json(
            {
                data
            }
        )
    } catch (error) {
        return res.json(
            {
                error
            }
        ).status(500)

    }
});



app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
