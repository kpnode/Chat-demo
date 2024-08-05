const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const session = require("express-session");
const bodyParser = require("body-parser");
const moment = require('moment');
require("dotenv").config();


const app = express();
app.use("/favicon", express.static('favicon'));
const server = http.createServer(app);
const io = socketIo(server);
const PORT = process.env.PORT || 3000;
const localhost = process.env.localhost;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const User = require("./Models/M_user");
const chat = require("./Models/M_chat");
const room = require("./Models/M_room");
const conn = require("./DB/conn");

app.set("view engine", "ejs");
app.set("views", "./views");

app.use(
  session({
    secret: "iamanodejsdeveloperatweapplinsetechnology", 
    resave: false,
    saveUninitialized: true,
  })
);

app.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;
  const random_number = Math.floor(Math.random() * 6) + 1;
  let profile = `https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-chat/ava${random_number}-bg.webp`;
  const data = {
    name: name,
    picture: profile,
    email: email,
    password: password,
  };
  const checkUser = await User.findOne({ email });
  if (checkUser) {
    res.render("sign_up", {
      notification: "Email already registered",
      mcolor: "danger",
      formData: req.body,
    });
  } else {
    const userdata = await User.create(data);
    req.session.user = userdata;
    req.session.toast = true;
    res.redirect("/");
    // socket.broadcast.emit("newUserSignedUp");
  }
});

const router = require("./Routes/R_user");
app.use(router);
var nsp = io.of("/chatapp");
nsp.on("connection", async (socket) => {
  var userid = socket.handshake.auth.token;
  const updateStatus = await User.findByIdAndUpdate(
    { _id: userid },
    { $set: { is_active: true } }
  );

  if (updateStatus) {
    socket.broadcast.emit("activeuser", { userid: userid });
  }

  // app.post("/signup", async (req, res) => {
  //   const { name, email, password } = req.body;
  //   const random_number = Math.floor(Math.random() * 6) + 1;
  //   let profile = `https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-chat/ava${random_number}-bg.webp`;
  //   const data = {
  //     name: name,
  //     picture: profile,
  //     email: email,
  //     password: password,
  //   };
  //   const checkUser = await User.findOne({ email });
  //   if (checkUser) {
  //     res.render("sign_up", {
  //       notification: "Email already registered",
  //       mcolor: "danger",
  //       formData: req.body,
  //     });
  //   } else {
  //     const userdata = await User.create(data);
  //     req.session.user = userdata;
  //     req.session.toast = true;
  //     res.redirect("/");
  //     socket.broadcast.emit("newUserSignedUp");
  //   }
  // });

  socket.on("changeListInActiveUSer", async () => {
    const latestMessage = await chat.findOne({ receiver_id: userid }).sort({ createdAt: -1 });
      const distinctSenderId = latestMessage ? latestMessage.sender_id : null;
  
      const allUsers = await User.find({ _id: { $ne: userid } });
      const sortedAllUsers = allUsers.sort((a, b) => {
          if (a._id.equals(distinctSenderId) && !b._id.equals(distinctSenderId)) return -1;
          if (!a._id.equals(distinctSenderId) && b._id.equals(distinctSenderId)) return 1; 
          return 0; 
      });
      let allLastMessages=[]
      const unreadCounts = await Promise.all(sortedAllUsers.map(async (otherUser) => {
          const count = await chat.countDocuments({ sender_id: otherUser._id, receiver_id: userid, isRead: false });
          const lastMsg = await chat.findOne({ sender_id: otherUser._id, receiver_id: userid }).sort({ createdAt: -1 }).limit(1);
          allLastMessages.push(lastMsg);
          return { userId: otherUser._id, count };    
      }));

      socket.emit("updatedUserList", { data: sortedAllUsers,unreadCounts:unreadCounts ,allLastMessages,});
  })

  socket.on("switchuser", async (data) => {
    userdata = await User.findById({ _id: data.receiver_id });
    socket.emit("userdata", userdata);
  });

  socket.on("newchat", async (data) => {
    const findRoom = await room.findOne({
      $and: [
        {
          $or: [
            { user_id: data.sender_id },
            { user_id: data.receiver_id }
          ]
        },
        {
          $or: [
            { other_user_id: data.sender_id },
            { other_user_id: data.receiver_id }
          ]
        }
      ]
    });
  if (!findRoom){
    const roomdata={
      user_id:data.sender_id,
      other_user_id:data.receiver_id,
      last_msg:data.msg,
      last_msg_id:data._id,
    }
    const createRoom=await room.create(roomdata);
  }
  else{
    const updateRoom=await room.findByIdAndUpdate({_id:findRoom._id},{$set:
      {
        last_msg:data.msg,
        last_msg_id:data._id,
      }
    })
  }
    socket.broadcast.emit("sendchat", { data: data });
    });
  
  socket.on("sortUserList", async (data) => {
      io.of('/chatapp').emit("sendBackToClient");
  });

  socket.on("sortUserListAfterSendMsg", async (data) => {
    const signeduser = await User.findById({ _id: userid });
            const lastMessagedUser = await room.find({
                $or: [
                    { user_id: userid },
                    { other_user_id: userid }
                ]
            }).sort({ updatedAt: -1 });
               
            const MessageData= lastMessagedUser.map(message => {
                const isToday = moment(message.updatedAt).isSame(new Date(), 'day');
                return {
                  ...message._doc,  // or message.toObject() depending on your setup
                  formattedUpdatedAt: isToday ? moment(message.updatedAt).format('hh:mm A') : moment(message.updatedAt).format('DD/MM/YYYY')
                };
                });
                
            const lastMessagedUserInfo = lastMessagedUser.flatMap(room => [
                { id: room.user_id.toString(), updatedAt: room.updatedAt },
                { id: room.other_user_id.toString(), updatedAt: room.updatedAt }
            ]);

            const uniqueLastMessagedUserInfo = Array.from(
                new Set(lastMessagedUserInfo.map(item => item.id))
            ).map(id => {
                return {
                    id,
                    updatedAt: lastMessagedUserInfo.find(item => item.id === id).updatedAt
                };
            }).filter(item => item.id !== userid.toString());

            uniqueLastMessagedUserInfo.sort((a, b) => b.updatedAt - a.updatedAt);

            const uniqueLastMessagedUserIds = uniqueLastMessagedUserInfo.map(item => item.id);
               
               const allUsers = await User.find({ _id: { $ne: userid } });

               const sortedAllUsers = allUsers.sort((a, b) => {
                const aIndex = uniqueLastMessagedUserIds.indexOf(a._id.toString());
                const bIndex = uniqueLastMessagedUserIds.indexOf(b._id.toString());

                if (aIndex !== -1 && bIndex === -1) {
                    return -1; 
                } else if (aIndex === -1 && bIndex !== -1) {
                    return 1; 
                } else if (aIndex !== -1 && bIndex !== -1) {
                    return aIndex - bIndex; 
                } else {
                    return 0; 
                }
            });
                  
                const unreadCounts = await Promise.all(sortedAllUsers.map(async (otherUser) => {
                    const count = await chat.countDocuments({ sender_id: otherUser._id, receiver_id: userid, isRead: false });
                    return { userId: otherUser._id, count };    
                }));  

    socket.emit("updatedUserList", { data: sortedAllUsers,unreadCounts:unreadCounts ,MessageData:MessageData,});
  })

  socket.on("unreadchat", async (data) => {
    const allUsers = await User.find({ _id: { $ne: data.receiver_id } }).sort({
      createdAt: -1,
    });
    const unreadCounts = await Promise.all(
      allUsers.map(async (otherUser) => {
        const count = await chat.countDocuments({
          sender_id: otherUser._id,
          receiver_id: data.receiver_id,
          isRead: false,
        });
        return { userId: otherUser._id, count };
      })
    );
    console.log({unreadCounts, data});
    socket.broadcast.emit("updateCounterinActiveUser", {
      unreadCounts: unreadCounts,
      data: data,
    });
  });

  socket.on("userIsOnline", async (data) => {
    console.log("data",{data});
     const updateChat= await chat.updateMany({sender_id:data.sender_id,receiver_id:data.receiver_id},{$set:{isRead:true}});
     io.of('/chatapp').emit("sendBackToClient");
  });

  socket.on("ReadByUser", async (data) => {
    const updateChat= await chat.updateMany({sender_id:data.receiver_id,receiver_id:data.sender_id},{$set:{isRead:true}});
    io.of('/chatapp').emit("sendBackToClient");
  });
  
  socket.on("existchats", async (data) => {
    const chats = await chat.find({
      $or: [
        { sender_id: data.sender_id, receiver_id: data.receiver_id },
        { sender_id: data.receiver_id, receiver_id: data.sender_id },
      ],
    });
    socket.emit("loadOldChats", { chats: chats });
  });
  
  socket.on("deletechat", async (id) => {
    const chatdata = await chat.findById({_id:id});
    const deleteChat=await chat.findByIdAndDelete({_id:id});
    // const deleteChat = await chat.findByIdAndUpdate({_id:id},{$set:{msg:"This message has been deleted"}});
    const findRoom = await room.findOne({
      $and: [
        {
          $or: [
            { user_id: chatdata.sender_id },
            { user_id: chatdata.receiver_id }
          ]
        },
        {
          $or: [
            { other_user_id: chatdata.sender_id },
            { other_user_id: chatdata.receiver_id }
          ]
        }
      ]
    });
    const chats = await chat.find({
      $or: [
        { sender_id: chatdata.sender_id, receiver_id: chatdata.receiver_id },
        { sender_id: chatdata.receiver_id, receiver_id: chatdata.sender_id },
      ],
    }).sort({createdAt:-1}).limit(1);
    if(chats.length>0){
      const updateRoom=await room.findByIdAndUpdate({_id:findRoom._id},{$set:
        {
          last_msg:chats[0].msg,
          last_msg_id:chats[0]._id,
        }
      })
    }else{
      const updateRoom=await room.findByIdAndUpdate({_id:findRoom._id},{$set:
        {
          last_msg:"",
          last_msg_id:null,
        }
      })
    }
    io.of('/chatapp').emit("sendBackToClient");
    socket.broadcast.emit("removechat", id);
  });

  socket.on("editchat", async (data) => {
    const chatdata = await chat.updateOne({_id:data.id},{$set:{msg:data.msg}});
    const updateRoomMsg=await room.updateOne({last_msg_id:data.id},{$set:{last_msg:data.msg}});
    io.of('/chatapp').emit("sendBackToClient");
    socket.broadcast.emit("editrecievechat", data);
  });

  socket.on("disconnect", async () => {
    const updateStatus = await User.findByIdAndUpdate(
      { _id: userid },
      { $set: { is_active: false } }
    );
    if (updateStatus) {
      socket.broadcast.emit("offlineuser", { userid: userid });
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://${localhost}:${PORT}`);
});
