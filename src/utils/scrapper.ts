import puppeteer, { Browser, Page } from "puppeteer";
import { writeFile } from "fs";
import { createWorker } from "tesseract.js";

function extractNamesWithTitles(namesString: string): string[] {
    const namesArray: string[] = namesString.split(',').map(name => name.trim());
    const result: string[] = [];

    const nameRegex: RegExp = /^(?:(?:[A-Z][a-z]*\.?\s*)+)?([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)(?:,\s*(?:[A-Z][a-z]*\.?\s*)+)?$/;

    for (const name of namesArray) {
        const match: RegExpMatchArray | null = name.match(nameRegex);
        if (match) {
            const fullName: string = match[1];
            const prefix: string = name.substring(0, match.index).trim();

            if (match.index) {
                const suffix: string = name.substring(match.index + match[0].length).trim();
                const fullTitle: string = (prefix ? prefix + ' ' : '') + fullName + (suffix ? ', ' + suffix : '');
                result.push(fullTitle);
            } else {
                result.push(fullName);
            }

        } else {
            result.push(name);
        }
    }

    return result;
}

const scrapeProdi = async () => {
    const browser = await puppeteer.launch({
        headless: true,
        defaultViewport: null,
    });

    const url = "https://www.itera.ac.id/fakultasitera/";
    const page = await browser.newPage();
    await page.goto(url, {
        waitUntil: "networkidle2",
    });

    const data = await page.evaluate(() => {
        const prodi = document.querySelectorAll(".eael-tabs-content .clearfix li");
        const prodiList: any[] = [];
        prodi.forEach((item: any) => {
            let prodiName = item.innerText.replace(/\n|\t/g, "");

            if (prodiName.includes("Program Studi")) {
                prodiName = prodiName.replace("Program Studi", "");
                prodiName = prodiName.trim();
            }

            if (!prodiList.includes(prodiName)) {
                prodiList.push(prodiName);
            }
        });
        return prodiList;
    });

    await browser.close();
    return data;
};


const scrapeFakultas = async () => {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
    });

    const url = "https://www.itera.ac.id/fakultasitera/";
    const page = await browser.newPage();
    await page.goto(url, {
        waitUntil: "networkidle2",
    });

    const data = await page.evaluate(() => {
        const prodi = document.querySelectorAll(".eael-tab-inline-icon li");
        const prodiList: any[] = [];
        prodi.forEach((item: any) => {
            let prodiName = item.innerText.replace(/\n|\t/g, "");

            if (!prodiList.includes(prodiName)) {
                prodiList.push(prodiName);
            }
        });
        return prodiList;
    });

    await browser.close();

    return data;
};

const loginSiakad = async (page: Page, browser: Browser) => {

    const cred = {
        username: "muhammad.120140194@student.itera.ac.id",
        password: "Masukaja123",
    };

    const url = "https://siakad.itera.ac.id/login/login";
    await page.goto(url, {
        waitUntil: "networkidle2",
    });

    await page.waitForSelector("#user");

    await page.$eval("#user", (el: any, value) => (el.value = value), cred.username);
    await page.$eval("#pwd", (el: any, value) => (el.value = value), cred.password);

    // download image captcha
    const newPageCaptcha = await browser.newPage();
    const imagePage = await newPageCaptcha.goto("http://sso.itera.ac.id/welcome/cpch", {
        waitUntil: "networkidle2",
    });

    if (imagePage) {
        writeFile("captcha.png", await imagePage.buffer(), () => {
            console.log("Captcha downloaded");
        });
    }

    console.log("Reading captcha...");

    const worker = await createWorker('eng');
    const { data: { text } } = await worker.recognize(
        "./captcha.png"
    );

    await worker.terminate();


    // switch to page 1
    await page.bringToFront();

    // delete text 'Berapa hasil dari' and ? in last index
    let captcha = text.replace("Berapa hasil dari", "").slice(0, -1);
    // delete last char in captcha
    captcha = captcha.slice(0, -1);
    // ambil semua angka dan operator
    //captcha = captcha.match(/\d+|\+|\-|\x|\/|\=|\?/g).join("");

    // jika ada operator x, ganti dengan *
    // jika ada operator :, ganti dengan /
    captcha = captcha.replace("x", "*").replace(":", "/");

    // lakukan perhitungan
    const result = eval(captcha);

    // input hasil perhitungan ke input captcha
    await page.$eval("#captcha", (el: any, value) => (el.value = value), result);
    // click Login
    await page.$eval("button[type='submit']", (el) => el.click());

    await page.waitForNavigation(
        {
            timeout: 0,
        }
    );

    console.log("Login success");
}


const scrapeKelas = async () => {

    const browser = await puppeteer.launch({
        headless: true,
        defaultViewport: null,
    });

    const page = await browser.newPage();

    await loginSiakad(page, browser);

    await page.goto("https://siakad.itera.ac.id/mahasiswa/kelas");

    console.log("Please wait...");

    // select perPage to 100
    await page.select("select[name='kelas_length']", "100");

    // input search
    await page.$eval("input[type='search']", (el: any) => {
        el.value = "IF";

        const event = new Event("input", {
            bubbles: true,
        });

        el.dispatchEvent(event);

        return;
    });

    const apiUrl = 'https://siakad.itera.ac.id/mahasiswa/kelas/json_kelas?Semester=20241'; // Ganti dengan URL request AJAX

    await page.waitForResponse(async response => {
        if (!response.url().startsWith(apiUrl)) {
            return false; // Bukan URL yang kita cari
        }
        try {
            const postData = response.request().postData();
            if (postData) {
                const params = new URLSearchParams(postData);
                const searchValue = params.get('search[value]');
                if (searchValue === 'IF') {
                    console.log('Found correct response:', response.url());
                    return true;
                }
            }
            return false; // Bukan request search data
        } catch (error) {
            return false; // Gagal membaca body request
        }
    }, { timeout: 30000 })

    //await waitForEnter();
    console.log("Scraping data...");

    const data = await page.evaluate(() => {
        const kelas = document.querySelectorAll("table tbody tr");
        const kelasList: any = [];
        kelas.forEach((item) => {
            const kelasData = item.querySelectorAll("td");
            const kelasObj = {
                kode: kelasData[0].innerText,
                nama: kelasData[1].innerText,
                kodeMk: kelasData[2].innerText,
                namaMk: kelasData[3].innerText,
                sks: kelasData[4].innerText,
            };
            kelasList.push(kelasObj);
        });
        return kelasList;
    });

    await browser.close();

    return data;
};


const scrapeFakultasDanProdi = async () => {

    const browser = await puppeteer.launch({
        headless: true,
        defaultViewport: null,
    });

    const url = "https://www.itera.ac.id/fakultasitera/";
    const page = await browser.newPage();
    await page.goto(url, {
        waitUntil: "networkidle2",
    });

    const data = await page.evaluate(() => {

        const fakultas = document.querySelectorAll(".eael-tab-inline-icon li");
        const prodiListElements = document.querySelectorAll(".eael-tabs-content .clearfix");
        const fakultasList: any = [];

        fakultas.forEach((item: any, index) => {
            let fakultasName = item.innerText.replace(/\n|\t/g, "");

            if (fakultasList.some((fakultas: any) => fakultas.fakultas === fakultasName)) {
                return;
            }

            const prodiList: any = [];

            prodiListElements[index].querySelectorAll("li").forEach((prodiItem: any) => {
                let prodiName = prodiItem.innerText.replace(/\n|\t/g, "");

                prodiName = prodiName.trim();

                prodiList.push(prodiName);
            });

            const fakultasObj = {
                fakultas: fakultasName,
                prodi: prodiList
            };

            fakultasList.push(fakultasObj);
        });

        return fakultasList;
    });

    await browser.close();

    return data;
}

const scrapeDosen = async () => {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
    });

    const url = "http://if.itera.ac.id/staff/";
    const page = await browser.newPage();
    await page.goto(url, {
        waitUntil: "networkidle2",
    });

    const data = await page.evaluate(() => {

        const dosens = document.querySelectorAll(".info");

        const dosenList: any = [];

        dosens.forEach((item: any) => {
            let nama = item.querySelector(".name")?.innerText || "";
            let email = item.querySelector(".email")?.innerText || "";

            let link = item.querySelector(".name")?.href || "";

            nama = nama.trim();
            email = email.trim();

            const dosenObj = {
                nama,
                email,
                link
            };

            dosenList.push(dosenObj);
        })

        return dosenList;
    });


    for (const list of data) {
        if (!list.link || !list.link.includes("if.itera.ac.id")) {
            list.nip = "";
            continue;
        }

        await page.goto(list.link, {
            waitUntil: "networkidle2",
        });

        let nip = await page.evaluate(() => {
            const table = document.querySelector(".profile-table");

            if (!table) {
                return "";
            }

            const row = table?.querySelector("tr");

            let nip = ""

            nip = row?.querySelectorAll("td")[1].innerText || "";

            return nip;
        });

        nip = nip.replace(":", "").trim();

        list.nip = nip;
    }


    await browser.close();

    return data;
}


const scrapeTahunAjaran = async () => {

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
    });

    const page = await browser.newPage();

    await loginSiakad(page, browser);

    await page.goto("https://siakad.itera.ac.id/mahasiswa/kelas");

    console.log("Please wait...");

    // get all option from select name Semester
    const data = await page.evaluate(() => {
        const options = document.querySelectorAll("select[name='Semester'] option");
        const optionsList: any = [];

        options.forEach((item: any) => {

            const id = item.value;
            if (id === "" || !id) {
                return;
            }
            // split name with space
            let name = item.innerText.split(" ");
            const semester = name[1] || "";
            const fullName = name[0] + " " + name[1];
            name = name[0];

            const tahunAwal = name.split("/")[0];
            const tahunAkhir = name.split("/")[1];

            const option = {
                id,
                name,
                semester,
                fullName,
                tahunAwal,
                tahunAkhir
            };

            optionsList.push(option);
        });

        return optionsList;
    });

    await browser.close();

    return data;
}

const scrapeKelasByTahunAjaran = async (id: string) => {

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
    });

    const page = await browser.newPage();

    await loginSiakad(page, browser);

    await page.goto("https://siakad.itera.ac.id/mahasiswa/kelas?Semester=" + id);

    console.log("Please wait...");


    // select perPage to 100
    await page.select("select[name='kelas_length']", "100");

    // input search
    await page.$eval("input[type='search']", (el: any) => {
        el.value = "IF";

        const event = new Event("input", {
            bubbles: true,
        });

        el.dispatchEvent(event);

        return;
    });


    const apiUrl = 'https://siakad.itera.ac.id/mahasiswa/kelas/json_kelas?Semester=' + id; // Ganti dengan URL request AJAX

    await page.waitForResponse(async response => {
        if (!response.url().startsWith(apiUrl)) {
            return false; // Bukan URL yang kita cari
        }
        try {
            const postData = response.request().postData();
            if (postData) {
                const params = new URLSearchParams(postData);
                const searchValue = params.get('search[value]');
                if (searchValue === 'IF') {
                    console.log('Found correct response:', response.url());
                    return true;
                }
            }
            return false; // Bukan request search data
        } catch (error) {
            return false; // Gagal membaca body request
        }
    }, { timeout: 30000 })

    //await waitForEnter();
    console.log("Scraping data...");

    await page.waitForSelector("table tbody tr");

    const data = await page.evaluate(() => {
        const kelas = document.querySelectorAll("table tbody tr");
        const kelasList: any = [];
        kelas.forEach((item) => {
            const kelasData = item.querySelectorAll("td");
            const kelasObj = {
                kode: kelasData[0].innerText,
                nama: kelasData[1].innerText,
                kodeMk: kelasData[2].innerText,
                namaMk: kelasData[3].innerText,
                sks: kelasData[4].innerText,
            };
            kelasList.push(kelasObj);
        });
        return kelasList;
    });

    await browser.close();

    return data;
}


const scrapeDetailKelas = async (id: string) => {

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
    });

    const page = await browser.newPage();

    await loginSiakad(page, browser);

    await page.goto("https://siakad.itera.ac.id/mahasiswa/kelas/lihat/" + id);

    console.log("Please wait...");

    await page.waitForSelector("table tbody tr");

    const data: any = await page.evaluate(() => {
        const tables = document.querySelectorAll("table");

        const sks = tables[0].querySelectorAll("tr");

        // check if inner text contains SKS
        let sksValue = 0;
        let dosenValue = "";
        sks.forEach((item) => {

            if (item.innerText.includes("Dosen")) {
                dosenValue = item.querySelectorAll("td")[2].innerText || "";
            }

            if (item.innerText.includes("SKS")) {
                sksValue = parseInt(item.querySelectorAll("td")[2].innerText) || 0;
            }
        });

        const mahasiswa = tables[1].querySelectorAll("tbody tr");

        const mahasiswaList: any = [];

        mahasiswa.forEach((item) => {
            const mahasiswaData = item.querySelectorAll("td");
            const mahasiswaObj = {
                nim: mahasiswaData[1].innerText,
                name: mahasiswaData[2].innerText,
            };
            mahasiswaList.push(mahasiswaObj);
        })

        const data = {
            sks: sksValue,
            dosen: dosenValue,
            mahasiswa: mahasiswaList
        }

        return data;
    })

    await browser.close();

    return data;
}



export {
    scrapeProdi,
    scrapeKelas,
    scrapeFakultas,
    scrapeFakultasDanProdi,
    scrapeDosen,
    scrapeTahunAjaran,
    scrapeKelasByTahunAjaran,
    scrapeDetailKelas
} 
