const express = require('express');
const path = require('path');
const db = require('./database');
const Router = express.Router();
var Sentiment = require('sentiment')
var date_fns = require('date-fns') 

Router.use('/page1',(req,res,next) => {
  res.send('<form action="/product" method = "POST"><input type="text" name="var1"><button type="submit">SUBMIT</button></form>');
});

Router.use('/product',(req, res, next)=>{
  console.log(req.body.var1);
  res.redirect('/');
}); 

Router.get('/index-auction',(req,res,next)=> {
  res.render('index-auction',{});
});


Router.get('/index-auction/:username',(req , res, next) => {
  const username = req.params.username;
  db.execute('select * from item where start_time < current_timestamp and end_time > current_timestamp;')
.then(([rows,  fieldData]) =>{
 
  res.render('index-auction',{
    username: username,
    products: rows
  })

}).catch(err => {
console.log(err);
});
  
});


Router.get('/description/:item_id/:username',(req,res,next) => {
  const item_id = req.params.item_id;
  const username = req.params.username;
  let item;
  let max_bid;
  db.execute('select * from item where item_id = ?',[item_id])
  .then(([rows,fieldData]) => {
    item = rows;
    db.execute('select * from bids where item_id = ?',[item_id])
    .then(([rows,fieldData]) => {
      for(values of rows){
        max_bid = values.b_offer;
      
      if(values.username == username){
      res.render('details',{
        username: username,
        max_bid: max_bid,
        products: item,
        bid_response: "You are the highest bidder",
        bid_expiry: "",
        button_value: ""
      });
    }
    else{
      res.render('details',{
        username: username,
        max_bid: max_bid,
        products: item,
        bid_response: "",
        bid_expiry: "",
        button_value: ""
      });
    }
    }
    }
    ).catch(err => {
      console.log(err);
    });
  }).catch(err => {
    console.log(err);
  });
  
});



Router.get('/my_product_details/:item_id/:username',(req,res,next) => {
  const item_id = req.params.item_id;
  const username = req.params.username;
  let highest_bid_val = "No bids yet!"

  db.execute('select * from item where item_id = ?',[item_id])
  .then(([rows,fieldData]) => {
    db.execute('select b_offer from bids where item_id = ? and username is not null',[item_id])
    .then(([row,fieldData]) => {
      for(value of row){
        highest_bid_val = value.b_offer;
      }
      res.render('my_product_details',{
        username: username,
        products: rows,
        highest_bid_val: highest_bid_val
      });
    }).catch();
    
  })
  .catch(err => {
    console.log(err)
  });
})


Router.get('/bought_items/:username',(req,res,next) => {
  const username = req.params.username;
  db.execute('select * from item where item_id in(select item_id from sold_item where username = ?);',[username])
  .then(([rows,fieldData]) => {
  res.render('bought_item',{
    username: username,
    products: rows
  });  
  })
  .catch(err => {
    console.log(err);  
  })
})


Router.post('/bid-check/:username/:item_id/:max_bid',(req,res,next) => {
  const item_id = req.params.item_id;
  const username = req.params.username;
  const max_bid = req.params.max_bid;
  const bid_val = req.body.bid_value;
  console.log(max_bid,bid_val)
  db.execute('select *,current_timestamp as Curr_time from item where item_id = ?',[item_id])
  .then(([rows,fieldData]) => {
    for(value of rows){
    if(value.end_time < value.Curr_time){
      res.render('details',{
        username: username,
        max_bid: max_bid,
        products: rows,
        bid_response: "",
        bid_expiry: "The product as expired",
        button_value: "disabled"
      });
    }
    else{
      db.execute('select * from bids where item_id = ?',[item_id])
      .then(([row_bids,fieldData]) => {
        for(bids of row_bids){
          if((bids.b_offer < bid_val && bids.username != username) || (bids.b_offer <= bid_val && bids.username == username)){
            db.execute('update bids set b_offer = ?, username = ? where item_id = ?',[bid_val,username,item_id])
            .then(
              res.render('details',{
                username: username,
                max_bid: bid_val,
                products: rows,
                bid_response: "You are the highest bidder",
                bid_expiry: "",
                button_value: ""
              })
            ).catch(err => {
              console.log(err);
            });
          }
          else{
            res.render('details',{
              username: username,
              max_bid: bid_val,
              products: rows,
              bid_response: "You were outbid!!",
              bid_expiry: "",
              button_value: ""
            })
          }
        }


      }).catch(err => {
        console.log(err);
      });
    }
    }

  }).catch(err => {
    console.log(err);
  });

});



Router.get('/seller_details/:username',(req,res,next) => {
  const username = req.params.username;
  let date_ob = new Date();
  let date = ("0" + date_ob.getDate()).slice(-2);
let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
let year = date_ob.getFullYear();
let hours = date_ob.getHours();
let minutes = date_ob.getMinutes();
let seconds = date_ob.getSeconds();
let min_date = year + "-" + month + "-" + date;
let min_time;
let max_date;
let year_int = parseInt(year,10);
let month_int = parseInt(month,10);
let date_int = parseInt(date,10);
max_date = date_fns.format(date_fns.addDays(new Date(year_int,month_int-1,date_int),2),'yyyy-MM-dd');

db.execute('select DATE_FORMAT(current_time,"%H:%i") as curr_time;')
.then(([rows,fieldData]) => {

  for(value of rows){
    min_time = value.curr_time;
  }
  res.render('sellerpage',{
    username: username,
    item_name: "",
    item_price: "",
    image: "",
    sell_date: "",
    min_date: min_date,
    min_time: min_time,
    max_date: max_date,
    item_price: "",
    error_message: "",
    start_time: "",
    end_time: "",
    description: ""

  });
}).catch();
// prints time in HH:MM format

 
})


Router.post('/add-product/:username',(req,res,next) => {
  let date_ob = new Date();
  let date = ("0" + date_ob.getDate()).slice(-2);
let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
let year = date_ob.getFullYear();
let hours = date_ob.getHours();
let minutes = date_ob.getMinutes();
let seconds = date_ob.getSeconds();
let min_date = year + "-" + month + "-" + date;
let max_date;
let year_int = parseInt(year,10);
let month_int = parseInt(month,10);
let date_int = parseInt(date,10);
max_date = date_fns.format(date_fns.addDays(new Date(year_int,month_int-1,date_int),2),'yyyy-MM-dd');
let min_time;
// = minutes + ":" + seconds;
  const username = req.params.username;
  const item_name = req.body.item_name;
  const imageobj = req.file;
  const sell_date = req.body.sell_date;
  const sell_date_end = req.body.sell_date_end;
  const item_price = req.body.item_price;
  let start_time_o = req.body.start_time;
  let end_time_o = req.body.end_time;
  let curr_timestamp;
  let curr_time;
  const description = req.body.description;
  let i = 0
  start_time = sell_date + ' ' + start_time_o;
  end_time = sell_date_end + ' ' + end_time_o;
  db.execute('select DATE_FORMAT(current_time,"%H:%i") as curr_time;')
  .then(([row1,fieldData]) => {
    for(val1 of row1){
      min_time = val1.curr_time;
      curr_timestamp = min_date + " " + min_time;
    }
    if(imageobj){
      const imageurl = "/images/"+ imageobj.filename;
  
      if(start_time.localeCompare(curr_timestamp) == -1 ){
        res.render('sellerpage',{
          username: username,
          item_name: item_name,
          item_price: item_price,
          image: imageobj,
          sell_date: sell_date,
          min_date: min_date,
          max_date: max_date,
          item_price: item_price,
          error_message: "Start Time must be greater than Current Time",
          start_time: "",
          end_time: "",
          description: description
      
        });
      }
      else{
      if(start_time.localeCompare(end_time) == 1){
  
  
        res.render('sellerpage',{
          username: username,
          item_name: item_name,
          item_price: item_price,
          image: imageobj,
          sell_date: sell_date,
          min_date: min_date,
          max_date: max_date,
          item_price: item_price,
          error_message: "Start Time must be greater than End Time",
          start_time: "",
          end_time: "",
          description: description
      
        });
      }
      else{
    db.execute('select * from item')
    .then(([rows,fieldData]) => {
      for(val of rows){
        i = i+1;
      }
      i = i+1;
      db.execute('insert into item values(?,?,?,?,?,?,?,?,?)',[i,item_price,item_name,description,start_time,end_time,username,imageurl,0])
      .then( result =>{
        res.render('sellerpage',{
          username: username,
          item_name: "",
          item_price: "",
          image: "",
          sell_date: "",
          item_price: "",
          min_date: min_date,
          max_date: max_date,
          error_message: "",
          start_time: "",
          end_time: "",
          description: ""
      
        });
      }
      )
      .catch(err => {
       console.log(err); 
      });
    })
    .catch(err => {
      console.log(err);
    });
  }
    }
  }
  else{
      res.render('sellerpage',{
        username: username,
        item_name: item_name,
        item_price: item_price,
        image: "",
        sell_date: sell_date,
        item_price: item_price,
        min_date: min_date,
        max_date: max_date,
        error_message: "The file must be in .jpg or .png or .jpeg format",
        start_time: start_time,
        end_time: end_time,
        description: description
    
      });
    }
  }).catch()
  
  
})


Router.get('/message/:username/:error_message',(req,res,next) => {
  let i = 0;
  const username = req.params.username;
  const error_message = req.params.error_message;
  db.execute('select * from messages where tusername = ?',[username])
  .then(([rows,fieldData]) => {
    for( val of rows){
      i = i+1;
    }
    
      res.render('message',{
        username: username,
        tusername: "",
        subj: "",
        msg: "",
        error_message: "",
        i: i,
        rows: rows
      })
    
  }).catch(err => {
    console.log(err)
  })
  
})


Router.post('/send_message/:username',(req,res,next) => {
  const fusername = req.params.username;
  const tusername = req.body.tusername;
  const subj = req.body.subj;
  const msg = req.body.msg;
  var response;
  var sentiment = new Sentiment();
  var result = sentiment.analyze(msg);
  console.log(result)
  if( result.score == 0 || result.score == 1 || result.score == -1 ){
    response = 128566;
  }
  else{
    if(result.score == 2) {
      response = 128515;
    }
    else{
      if(result.score == -2){
        response = 128542;
      }
      else{
        if(result.score > 2){
          response = 128513;
        }
        else{
          response = 128555;
        }
      }
    }
  }
  let c = 0;
  let i = 0;
  db.execute('select * from user where username = ?',[tusername])
  .then(([rows,fieldData]) => {
    for( val of rows ){
    if(fusername != val.username){
      c= c+1;
    }
    }
    if(c == 0){

      db.execute('select * from messages where tusername = ?',[fusername])
      .then(([rows,fieldData]) => {
        for( val of rows){
          i = i+1;
        }

        
      res.render('message',{
        username: fusername,
        tusername: "",
        subj: subj,
        msg: msg,
        i: i,
        error_message: "Cannot send to this user!!",
        rows: rows
      })

      }).catch(err => {
        console.log(err)
      });

    }
    else{
      db.execute('insert into messages values(current_time,?,?,?,?,?,?)',[fusername,tusername,subj,msg,0,response])
  .then(([rows,fieldData]) => {
    res.redirect('/message/'+fusername+'/message');
  })
  .catch(err => {
    console.log(err)
  })
    }
  }).catch();



  
})



Router.get('/sold_item/:username',(req,res,next) => {
  const username = req.params.username;
  db.execute('select item.item_id, item.username as seller,sold_item.username as buyer, image_url,initial_price,iname,descript from item,sold_item where item.item_id = sold_item.item_id and item.username = ?',[username])
  .then(([rows,fieldData]) => {
    res.render('sold_item',{
      username: username,
      products: rows
    })
  })
  .catch(err => {
    console.log(err);
  })
})



Router.get('/my_products/:username',(req,res,next) => {
  const username = req.params.username;
  let i = 0;
  db.execute('select * from buyer where username = ?',[username])
  .then(([rows,fieldData]) => {
    for(value of rows){
      i = i+1;
    }
    if(i == 1){
      res.redirect('/index-auction/'+username)
    }
    else {
      db.execute('select * from item where username = ?',[username])
      .then(([rows,  fieldData]) =>{
       
        res.render('my_products',{
          username: username,
          products: rows
        })
      
      }).catch(err => {
      console.log(err);
      });
    }
  }).catch(err => {
    console.log(err);
  });




 

})




Router.get('/',(req , res, next) => {
  res.render("login",{
    error_message: "",
    username: "",
    passwd: ""
  });
});


Router.get('/logout',(req,res,next) => {
  res.render("login",{
    error_message: "",
    username: "",
    passwd: ""
  });
});

Router.post('/login_auth',(req,res,next)=> {
  let a = 0;
  let b = 0;
  db.execute('select passwd from user where username = ?',[req.body.username])
  .then(([rows,fieldData]) => {
    for(values in rows){
      a += 1;
    }
    if (a === 0){
      res.render("login",{
        error_message: "Check User Name or Password",
        username: req.body.username,
        passwd: ""
      }); // continue here
    }
    else{
    for(values of rows){
      if(values.passwd === req.body.passwd){
        db.execute('select * from buyer where username = ?',[req.body.username])
        .then(([rows,fieldData]) => {
          for(temp_row in rows){
            b = b+1;
          }
          if(b == 0){
            res.redirect('/seller_details/'+req.body.username)
          }
          else{
            res.redirect('/index-auction/'+req.body.username)
          }
        })
        .catch();
        
      }
      else{
        res.render("login",{
          error_message: "Check User Name or Password",
          username: req.body.username,
          passwd: ""
        });
      }
      }
    }
      
    })
  .catch(err => {
    console.log(err);
  });

});



Router.get('/bid_response/:item_id',(req,res,next) => {
  const item_id = req.params.item_id;
  db.execute('select b_offer from bids where item_id = ?',[item_id])
  .then(([rows,fieldData]) => {
    for(value of rows){
      res.status(200).send(value.b_offer.toString(10));
    }
  })
  .catch(err => {
    console.log(err);
  });
});

Router.get('/buyer',(req , res, next) => {
  res.render('buyer',{
    error_message: "",
    username: "",
    passwd: "",
    address: "",
    phone_no: "",
    income: "",
    education: "",
    profession: ""
  });
});



Router.get('/seller',(req , res, next) => {
  res.render('seller',{
    error_message: "",
    username: "",
    passwd: "",
    address: "",
    phone_no: "",
    comp_name: "",
    refer: "",
    location: ""
  });
});





Router.post('/buyer_fill',(req , res, next) => {
if( req.body.passwd != req.body.re_passwd){
  res.render("buyer",{
    error_message: "Password does not match!",
    username: req.body.username,
    passwd: "",
    address: req.body.address,
    phone_no: req.body.phone_no,
    income: req.body.income,
    education: req.body.education,
    profession: req.body.profession
  });
} 
else{
  
  db.execute('insert into user(username,address,passwd,phone_no) values(?,?,?,?)',[req.body.username,req.body.address,req.body.passwd,req.body.phone_no])
.then(()=> {
  db.execute('insert into buyer(username,profession,income,education) values(?,?,?,?)',[req.body.username,req.body.profession,req.body.income,req.body.education])
.then(()=>{
  res.redirect("/");
}).catch(err=>{
  console.log(err);
});
}).catch(err => {
  res.render("buyer",{
    error_message: "User Name Already Exists",
    username: "",
    passwd: req.body.passwd,
    address: req.body.address,
    phone_no: req.body.phone_no,
    income: req.body.income,
    education: req.body.education,
    profession: req.body.profession
  });
});
}
});





Router.post('/seller_fill',(req , res, next) => {
  if( req.body.passwd != req.body.re_passwd){
    res.render("seller",{
      error_message: "Password does not match!",
      username: req.body.username,
      passwd: "",
      address: req.body.address,
      phone_no: req.body.phone_no,
      comp_name: req.body.comp_name,
      refer: req.body.refer,
      location: req.body.location
    });
  } 
  else{
  
  db.execute('insert into user(username,address,passwd,phone_no) values(?,?,?,?)',[req.body.username,req.body.address,req.body.passwd,req.body.phone_no])
.then(()=> {
  db.execute('insert into seller(username,comp_name,refer,location) values(?,?,?,?)',[req.body.username,req.body.comp_name,req.body.refer,req.body.location])
.then(()=>{
  res.redirect("/");
}).catch(err=>{
  console.log(err);
});
}).catch(err => {
  res.render("seller",{
    error_message: "User Name Already Exists",
    username: "",
    passwd: req.body.passwd,
    address: req.body.address,
    phone_no: req.body.phone_no,
    comp_name: req.body.comp_name,
    refer: req.body.refer,
    location: req.body.location
  });
});
  }
});



  
//  if(!image){
//    //Invalid Response
//  }
//  else{
//    const imageurl = image.path;
//  }



module.exports = Router;