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
const bookReviews = db.collection('book-review'); 


app.get('/blog/:id/:title', async (req, res) => {
    let {id} = req.params;

    if(id){
        let cacheDoc = myCache.get(id);
        let allDocs = await getAllDocs();
        let allbookReviews = await getAllBookReview();
        if(cacheDoc){
            res.render('pages/blog', {...cacheDoc, bookReviews:allbookReviews.slice(0,3), blogs:allDocs});
            return;
        }

        let snapshot = await blogsDb.doc(id).get();
        let doc = snapshot.data();
        
        myCache.set( id, doc, 86400 );
        res.render('pages/blog', {...doc, bookReviews:allbookReviews.slice(0,3), blogs:allDocs});
        return;
    }

    res.render('pages/error', {title:null});
});

app.get('/book-review/:id/:title', async (req, res) => {
    let {id} = req.params;

    if(id){
        let cacheDoc = myCache.get(id);
        
        let allbookReviews = await getAllBookReview();
        if(cacheDoc){
            res.render('pages/book', {...cacheDoc, bookReviews:allbookReviews});
            return;
        }

        let snapshot = await bookReviews.doc(id).get();
        let doc = snapshot.data();
        
        myCache.set( id, doc, 86400 );
        res.render('pages/book', {...doc, bookReviews:allbookReviews});
        return;
    }

    res.render('pages/error', {title:null});
});

app.get('/', async (req, res) => {
    //let allDocs = await getAllDocs();
    let allbookReviews = await getAllBookReview();
    //res.render('pages/index', {blogs:allDocs, title:null});
    res.render('pages/index', {bookReviews:allbookReviews, title:null});
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

async function getAllBookReview(){
    let docs = myCache.get("allbookreview");
    if(docs){
        return docs;
    }

    let snapshot = await bookReviews.get();
    let allDocs = snapshot.docs.map(doc => {
        
        let { title, image, amazon_link, content="" } = doc.data();
        let url = `/book-review/${doc.id}/${encodeURI(title.replace(/ /g, "-"))}`;

        return { title, url, amazon_link, content, image };
    });
    
    myCache.set( "allbookreview", allDocs, 86400 );
    return allDocs;
}

app.get('/*', (req, res) => {
    res.render('pages/error', {title:null});
});

module.exports = app;