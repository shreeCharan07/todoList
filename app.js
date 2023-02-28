//jshint esversion:6

const express = require("express");
const bodyParcer = require("body-parser");
const mongoose = require("mongoose");

const app = express();

app.set("view engine", "ejs");



app.use(bodyParcer.urlencoded({
  extended: true
}));
app.use(express.static("public"));

mongoose.set('strictQuery', true);

mongoose.connect("mongodb+srv://charan:test123@cluster1.kxl6qk3.mongodb.net/todolistDB")

//mongoose.connect("mongodb://127.0.0.1:27017/todolistDB", {useNewUrlParser : true});

const itemsSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model("Item", itemsSchema);


const item1 = new Item({
  name: "Welcome to your todolist!!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item"
});

const item3 = new Item({
  name: "<-- Hit this to delete an item"
});

const defaultItems = [item1, item2, item3]  //adding this items into an array called defaultItems

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
})

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {


  Item.find({}, function(err, foundItems){   //to find all we use "{}"

    if(foundItems.length === 0){  //if founditems array is empty it should inserted or we have to render existing all the elements
      Item.insertMany( defaultItems, function(err){
        if(err){
          console.log(err);
        }else{
          console.log("sucessfully saved deafult items to DB ");
        }
      });
      res.redirect("/") // to display inserting we use redirect

    }else{
        res.render("list", {
          listTitle: "Today",
          newList: foundItems
        });

    }//else closingg

  }) //item.find closing

}); // app.get closingtag

app.get("/:customListName", function(req , res){
  const customListName = req.params.customListName

  //now since we are saving the items everytime the items gets added twice so to delete the same name item we will use FindOne() method

  List.findOne({name: customListName}, function(err , foundList){
    if(!err){
      if(!foundList){ // if we there is no object that were found that have same name then we are going to create a new list
        //create a new list which newpath i.e, customListName
        const list = new List({  //foundlist is nothing but this current list
          name: customListName,
          items: defaultItems
        })

        list.save();
        res.redirect("/" + customListName) // it will be redirected to the particular route

      }else{
        // show existing list
        //console.log("exist!");
        res.render("List", {
          listTitle: foundList.name,
          newList: foundList.items
        })

      }
    }
  })



})






app.post("/delete", function(req , res){  //this function does when i checked the box the particular item will get deleted
  const checkedBody =  req.body.checked
  console.log(checkedBody);
  const listedName = req.body.listyName

  if(listedName === "Today"){
    Item.findByIdAndRemove(checkedBody, function(err){
      if(!err){
        console.log("sucessfully deleted the list");
        res.redirect("/")
      }
    });

  }else{ // this is to delete in the custom path/list
    // Now because inside our list document there's an array of item documents then it's actually a little bit more complex because we basically have to find an item inside this array.
    //We have to basically crawl through this array and find an item with a particular ID and then remove the entire item from the array.
    //the pull operator removes from an existing array all instances of a value or values that match a specified condition.
    //So we can use this along with the Mongoose method which is called findOneAndUpdate to combine these two together in order to achieve what it is that we need
    //first is the condition so which list do we have to find , which is The list that we want to find has to have a name that corresponds to this listName constant
    //second condition what update we want to make which is $pull  , third condition is callback
    // Well first we need to use the pull operator, and then we're going to specify something that we want to pull from and here we have to provide the name of the array inside this list that we found and that
    // name is of course going to be items. So now we can say pull from the items array.
    // Now how do we know which item out of all of the items we want to pull? Well here's another further set of curly braces where we provide the query for matching the item.
    // The query we're going to make is we're going to pull the item which has an ID that corresponds to thecheckedItemId.So we're going to put that in there.
  List.findOneAndUpdate({name: listedName}, {$pull: {items:{_id: checkedBody}}}, function(err, foundList){
    if(!err){
      res.redirect("/" + listedName);
    }

  })

  }//else ending



}); //post ending

app.post("/", function(req, res) {


  let itemName = req.body.newItem;
  const listName = req.body.List;

  const item = new Item({
    name: itemName
  })

  if(listName === "Today"){ //listName is nothing but the value we give in that particular route
    item.save() // items got saved and the saved items will be redirected to home route
    res.redirect("/")

  }else{
    List.findOne({name: listName}, function(err , foundList){
      foundList.items.push(item);  // here item is the new item we are adding i.e, in the 134th line
      foundList.save();
      res.redirect("/" + listName);

    })
  }

})




app.listen(5000, function() {
  console.log("server is running on port 5000!");
})
