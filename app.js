//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose")
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB", {
  useNewUrlParser: true
});

mongoose.set('useFindAndModify', false);

const itemsSchema = {
  name: String
};

const Item = mongoose.model('item', itemsSchema);

const one = new Item({
  name: "Welcome to your To Do List!"
});
const two = new Item({
  name: "Hit the + button to add a new item."
});
const three = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [one, two, three];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model('list', listSchema);

app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems) {
    if (err) {
      console.log(err);
    } else {
      if (foundItems.length === 0) {
        Item.insertMany(defaultItems, function(err) {
          if (err) {
            console.log(err);
          } else {
            console.log("Success");
            res.redirect("/");
          }
        });
      } else {
        res.render("list", {
          listTitle: "Today",
          newListItems: foundItems
        });
      }

    }
  });
});

app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({
    name: customListName
  }, function(err, foundList) {
    if (!err) {
      if (!foundList) {
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items
        });
      }
    }
  });


});

app.get("/favicon.ico"function(req, res) {
  res.sendStatus(204);
});

app.post("/", function(req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item({
    name: itemName
  });

  if (listName === "Today") {
    newItem.save();
    res.redirect("/");
  } else {
    List.findOne({
      name: listName
    }, function(err, foundList) {
      foundList.items.push(newItem);
      foundList.save();
      res.redirect("/" + listName);
    });
  }

});

app.post("/delete", function(req, res) {
  const deleteID = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(deleteID, function(err) {
      if (err) {
        console.log(err);
      } else {
        console.log("Successfully deleted item");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name: listName},{$pull: {items: {_id: deleteID}}}, function(err, foundList){
      if (!err){
        res.redirect("/"+listName);
      }

    });

  }
});




app.get("/about", function(req, res) {
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
