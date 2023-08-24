const fs = require("fs");
const path = require('path');
const Handlebars = require("handlebars");

const translations = {
    fr: {
        "About me": "À propos",
        "Address": "Adresse",
        "Education": "Formation",
        "Email": "Email",
        "Languages": "Langues",
        "Phone": "Téléphone",
        "Skills": "Compétences",
        "Website": "Site Web",
        "Work experience": "Expériences",
    }
}

function translateObject(obj, lang) {
    const keys = Object.keys(obj);
    if (keys.some((key) => !key.startsWith("_"))) {
        return keys.reduce((p, key) => ({
            ...p,
            [key]: translateValue(obj[key], lang)
        }), {});
    }
    const targetKey = `_${lang}`;
    if (!keys.includes(targetKey)) {
        throw new Error(`Missing translation key: ${targetKey}`)
    }
    return obj[targetKey];
}

function translateValue(value, lang) {
    if (Array.isArray(value)) {
        return value.map((item) => translateValue(item, lang));
    }
    if (typeof value === 'object') {
        return translateObject(value, lang);
    }
    return value;
}


function render(resume) {
    const css = fs.readFileSync(__dirname + "/style.css", "utf-8");
    const tpl = fs.readFileSync(__dirname + "/resume.hbs", "utf-8");
    const partialsDir = path.join(__dirname, 'partials');
    const filenames = fs.readdirSync(partialsDir);

    const language = process.env.RESUME_LANG ?? "en";
    const dict = translations[language] ?? {};
    const translated = translateObject(resume, language);

    Handlebars.registerHelper("i18n", (value) => {
        return dict[value] ?? value;
    })

    filenames.forEach(function (filename) {
        const matches = /^([^.]+).hbs$/.exec(filename);
        if (!matches) {
            return;
        }
        const name = matches[1];
        const filepath = path.join(partialsDir, filename)
        const template = fs.readFileSync(filepath, 'utf8');

        Handlebars.registerPartial(name, template);
    });
    return Handlebars.compile(tpl)({
        css: css,
        resume: translated
    });
}

module.exports = {
    render: render,
    pdfRenderOptions: {
        format: 'A4',
        mediaType: 'print',
        margin: {
            top: '0',
            bottom: '0',
            left: '0',
            right: '0',
        },
    },
};
