const express = require('express')
const app = express();

const NodeCache = require( "node-cache" );
const myCache = new NodeCache();

app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));


const fs = require('firebase-admin');
const serviceAccount = require('./key.json');
fs.initializeApp({
 credential: fs.credential.cert(serviceAccount)
});

const db = fs.firestore(); 
const blogsDb = db.collection('blogs'); 


app.get('/blog/:id/:title', async (req, res) => {
    let {id} = req.params;

    if(id){
        let cacheDoc = myCache.get(id);
        let allDocs = await getAllDocs();
        if(cacheDoc){
            res.render('pages/blog', {...cacheDoc, blogs:allDocs});
            return;
        }

        let snapshot = await blogsDb.doc(id).get();
        let doc = snapshot.data();
        
        myCache.set( id, doc, 86400 );
        res.render('pages/blog', {...doc, blogs:allDocs});
        return;
    }

    res.render('pages/error', {title:null});
});

app.get('/', async (req, res) => {
    let allDocs = await getAllDocs();
    res.render('pages/index', {blogs:allDocs, title:null});
});

async function getAllDocs(){
    let docs = myCache.get("alldocs");
    if(docs){
        return docs;
    }

    let snapshot = await blogsDb.get();
    let allDocs = snapshot.docs.map(doc => {
        
        let { title, about, index_image_url } = doc.data();
        let url = `/blog/${doc.id}/${encodeURI(title.replace(/ /g, "-"))}`;

        return { title, url, about, index_image_url };
    });
    
    myCache.set( "alldocs", allDocs, 86400 );
    return allDocs;
}

app.get('/*', (req, res) => {
    res.render('pages/error', {title:null});
});

module.exports = app;