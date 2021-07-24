const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { storage, fileFilter } = require('./helper/multerupload');
const maxSize = 5 * 1000 * 1000;
const textgears = require('textgears-api');
const axios = require('axios');



const app = express();
const port = 3000;
var recentfile = '';
var fileContent = [];

var errors =[];
var suggestions="";

app.use(express.static(path.join(__dirname, 'public')))

app.set('view engine', 'ejs');

app.get('/', (req, res) => {

    res.render('index', { fileContent });
});



app.get('/read-file', (req, res) => {

    try {
        var data = fs.readFileSync(`public/upload-file/${recentfile}`, 'utf8');
        fileContent = data.toString();
        res.send(data.toString());
    } catch (e) {
        console.log('Error:', e.stack);
    }
});

app.get('/demo', (req, res) => {

    const textgearsApi = textgears('odV2RoUv14hsYwxo', { language: 'en-US' });
    textgearsApi.checkGrammar('I is a enginer')
        .then((data) => {
            for (const error of data.response.errors) {
                console.log('Error: %s. Suggestions: %s', error.bad, error.better.join(', '));
            }
            res.send(data.response.errors);
        })
        .catch((err) => { });
});


app.post('/upload-file', (req, res) => {
    console.log('abc');
    console.log(req.file);
    const fileUploadPath = 'public/upload-file';
    var filetypes = /txt|text/;
    req.fileDetails = {
        type: "single",
        fileUploadPath,
        filetypes
    }


    const UploadSingle = multer({
        storage,
        limits: { fileSize: maxSize },
        fileFilter
    }).single("file");
    UploadSingle(req, res, function (err) {
        if (err) {
            return res.send({ message: err, status: 0 });
        }
        else if (!req.file) {
            return res.status(404).send({ message: 'Please select an file to upload', status: 0 });
        }
        else if (err instanceof multer.MulterError) {
            return res.send({ err, status: 0 });
        }
        else {
            console.log('file uploaded');
            console.log(req.file.filename);
            recentfile = req.file.filename;
            // return res.send({msg: 'file uploaded successfully'});

            try {
                var data = fs.readFileSync(`public/upload-file/${recentfile}`, 'utf8');
                fileContent = data;
                const textgearsApi = textgears('odV2RoUv14hsYwxo', { language: 'en-US' });
                textgearsApi.checkGrammar(fileContent)
                    .then((data) => {
                        for (const error of data.response.errors) {
                            
                            if(error.type ==="spelling"){
                                // errors.push(error.bad)
                                suggestions+=error.better.join(', ');
                                errors.push(error.better[0])
                                fileContent = fileContent.replace(error.bad, error.better[0]);
                            }
                            // console.log('Error: %s. Suggestions: %s', error.bad, error.better.join(', '));
                        }
                        console.log(suggestions);
                        console.log(errors);
                        // res.send(data.response.errors);

                        res.render('index', {fileContent,errors,suggestions});
                    })
                    .catch((err) => { });
                // res.render('index', {fileContent});
                // res.send(data.toString());
            } catch (e) {
                console.log('Error:', e.stack);
            }



        }
    })
});



app.get('*', function (req, res) {

    res.send('Oops!! The page you are looking is not found.', 404);
});


app.listen(process.env.PORT || 3000, () => {

    console.log(`Spell Check app listening at http://localhost:${port}`)
});


let ap = [
    { "id": "e937710492", "offset": 5, "length": 2, 
    "description": { "en": "File types are normally capitalized." }, "bad": "js", "better": ["JS"], "type": "uncategorized" },
     { "id": "e65601495", "offset": 19, "length": 2, "description": { "en": "Did you mean “am” or “will be”?" },
       "bad": "is", "better": ["am", "will be"], "type": "grammar" },
     { "id": "e7793886", "offset": 22, "length": 1, "description": { "en": "Use “an” instead of ‘a’ if the following word starts with a vowel sound, e.g. ‘an article’, ‘an hour’." }, "bad": "a", "better": ["an"], "type": "spelling" }]
