const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const favicon = require('serve-favicon');
const multer = require('multer');

const app = express();

let global_var = 1;

const routes = require('./routes');

app.set('view engine', 'ejs');
app.set('views','views');

const filestorage = multer.diskStorage({
  destination: (req,file,cb) => {
    cb(null, "public/images");
  },
  filename : (req, file, cb) => {
    cb(null,req.body.item_name + "-" + file.originalname);
  }
});

const filefilter = (req, file, cb)=>{
  if(file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg' ){
  cb(null,true);
  }
  else{
  cb(null,false);
  }
};

const db = require('./database');
app.listen(3000);

app.use(bodyParser.urlencoded({extended: false}));

app.use(multer({storage: filestorage, fileFilter: filefilter}).single('image'));

app.use(express.static(path.join(__dirname,'public')));

app.use(favicon(path.join(__dirname,'public','icon.ico')));

app.use(routes);

app.use((req,res,next)=>{
  res.status(404).send("<h1>Page Not Found!!</h1>")
});


setInterval(()=>{
if(db){
db.execute('select iname,item.item_id,item.end_time,b_offer,bids.username from bids,item where bids.item_id = item.item_id and item.end_time < current_timestamp and flag = 0 and bids.username is not null;')
.then(([rows,fieldData]) => {
  for(value of rows){
  // db.execute('select * from bids where item_id = ? and username is not NULL',[value.item_id])
  // .then(([row,fieldData]) => {
  //   for(val of row){
  //     console.log(value.item_id);
    db.execute('insert into sold_item values(?,current_timestamp,?,?,?,?)',[value.item_id,value.iname,value.b_offer,value.username,1])
    .then(result => {
      // db.execute('insert into messages values(current_timestamp,?,?,?,?)',['SYSTEM',value.username,'DELIVERY','Your Item Will be Delivered by Akash'])
      // .then(([r,fieldData]) => {
        
        db.execute('update item set flag = 1 where item_id = ?',[value.item_id])
        .then(result => {

        }).catch(err => {
          console.log(err);  
        });
      // }).catch(err => {
      //   console.log(err)
      // })
    }).catch(err => {
      console.log(err)  
    })
    }
  // })//
  // .catch(err => {
  //   console.log(err);
  // }); // 
  // }
})
.catch(err => {
  console.log(err);
});  
}
},10000)



// setInterval(()=>{
//   if(db){
//   db.execute('select iname,item.item_id,item.end_time,b_offer,bids.username from bids,item where bids.item_id = item.item_id and item.end_time < current_timestamp and flag = 0 and bids.username is not null;')
//   .then(([rows,fieldData]) => {
//     for(value of rows){
//       db.execute('update item set flag = 1 where item_id = ?',[value.item_id])
//       .then(result => {
//         db.execute('insert into sold_item values(?,current_timestamp,?,?,?,?)',[value.item_id,value.iname,value.b_offer,value.username,1]).then(result =>{
//           console.log(result)
            
          
//         });
//       })
//       .catch(err =>{
//         console.log(err)
//       })
//       }
//   })
//   .catch(err => {
//     console.log(err);
//   });  
//   }
//   },10000)


setInterval(() => {
  if(db){
    db.execute('DELETE n1 FROM sold_item n1, sold_item n2 WHERE n1.time_stamp > n2.time_stamp AND n1.item_id = n2.item_id;')
    .then().catch();
  }
},2500)


