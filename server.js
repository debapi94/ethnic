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
        if(cacheDoc){
            res.render('pages/blog', cacheDoc);
            return;
        }

        let snapshot = await blogsDb.doc(id).get();
        let doc = snapshot.data();
        
        myCache.set( id, doc, 86400 );
        res.render('pages/blog', doc);
        return;
    }

    res.render('pages/error', {title:null});
});

app.get('/', async (req, res) => {
    let docs = myCache.get("alldocs");
    if(docs){
        res.render('pages/index', {blogs:docs, title:null});
        return;
    }

    let snapshot = await blogsDb.get();
    let allDocs = snapshot.docs.map(doc => {
        
        let { title, about } = doc.data();
        let url = `/blog/${doc.id}/${title.replace(/ /g, "-")}`;

        return { title, url, about };
    });
    
    myCache.set( "alldocs", allDocs, 86400 );
    res.render('pages/index', {blogs:allDocs, title:null});
});

app.get('/*', (req, res) => {
    res.render('pages/error', {title:null});
});

module.exports = app;