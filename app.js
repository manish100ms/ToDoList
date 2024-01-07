const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const lodash = require("lodash");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

mongoose.connect("mongodb://localhost:27017/todolistDB");

const itemSchema = {
  name: String,
};
const itemModel = new mongoose.model("listItem", itemSchema);

const listSchema = {
  name: String,
  items: [itemSchema],
};
const listModel = new mongoose.model("list", listSchema);

const item1 = new itemModel({ name: "Welcome to your ToDo List!" });
const item2 = new itemModel({
  name: "Click the '+' icon to add new items.",
});
const item3 = new itemModel({
  name: "<-- Hit this to delete an item.",
});

const defaultItems = [item1, item2, item3];

app.get("/", function (req, res) {
  res.redirect("/Home");
});

app.get("/:listTitle", function (req, res) {
  const urlTitle = lodash.capitalize(req.params.listTitle);

  listModel.find({ name: urlTitle }).then((listsFromDB) => {
    if (listsFromDB.length === 0) {
      console.log("List not found. Making a new one with default items.");
      const list = new listModel({
        name: urlTitle,
        items: defaultItems,
      });

      defaultItems.forEach((defaultItem) => {
        const newItem = new itemModel({
          name: defaultItem.name,
        });
        newItem.save();
      });

      list.save().then(() => {
        res.render("index", {
          listTitle: urlTitle,
          itemsArr: defaultItems,
        });
      });
    } else {
      console.log("List found. Loading the list.");
      res.render("index", {
        listTitle: urlTitle,
        itemsArr: listsFromDB[0].items,
      });
    }
  });
});

app.post("/", function (req, res) {
  const listName = req.body.listName;
  const newItem = new itemModel({
    name: req.body.newItem,
  });
  if (newItem.name !== "") {
    newItem.save().then(() => {
      listModel
        .findOneAndUpdate({ name: listName }, { $push: { items: newItem } })
        .then(() => {
          res.redirect("/" + listName);
        });
    });
  } else {
    res.redirect("/");
  }
});

app.post("/delete", function (req, res) {
  const checkedItem = req.body.itemsCheckArr;
  const listName = req.body.listName;

  itemModel
    .findOneAndDelete({ _id: checkedItem })
    .then(() => {
      console.log("Removed from items");
    })
    .then(() => {
      listModel
        .findOneAndUpdate(
          { name: listName },
          { $pull: { items: { _id: checkedItem } } }
        )
        .then(() => {
          console.log("Removed from list");
          res.redirect("/" + listName);
        });
    });
});

const port = process.env.PORT || 3000;

app.listen(port, function () {
  console.log(`Server listening on port ${port}`);
});
