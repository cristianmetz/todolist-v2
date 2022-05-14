//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const res = require("express/lib/response");
const { redirect } = require("express/lib/response");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


mongoose.connect("mongodb+srv://admin-cristian:jodwit-Jykrom-6pyzke@cluster0.d44wg.mongodb.net/todolistDB", {useNewUrlParser: true});

const itemSchema = new mongoose.Schema({
  name : String
});

//Mongoose models are usually capitalized
const Item = mongoose.model('Item', itemSchema);

const item1 = new Item ({
  name: "Welcome to your todolist!"
});

const item2 = new Item ({
  name: "Hit the + button to add new item."
});

const item3 = new Item ({
  name: "<-- Hit this to delete an item "
});

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema ({
  name : String,
  items: [itemSchema]
});

const List = mongoose.model("List", listSchema)

app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems){
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err){
        if (err) {
          console.log(err);
        } else {
          console.log("Default documents added successfully");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    };

  });

 
});

/*Create a route parameter to create a dynamic route based on the route parameters*/
app.get('/:customListName', (req, res) => {
const customListName = _.capitalize(req.params.customListName);

List.findOne({name: customListName}, (err, foundList)=>{
  if (!err) {
    if(!foundList) {
      //create a new list
      const list = new List ({
        name: customListName,
        items: defaultItems
      });
      list.save();
      res.redirect("/"+customListName);
    }else {
      //Show an existing list
      res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
    }
  }
});

});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item ({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function (err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }

});

app.post('/delete', (req,res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  
  if (listName === "Today") {
    Item.findByIdAndDelete(checkedItemId, (err) => {
      if (!err) {
        console.log("Successfully deleted item");
        res.redirect('/');
      }
  });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function (err, foundList) {
      if (!err) {
        res.redirect("/" + listName);
      }
    });

  }

});


app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
