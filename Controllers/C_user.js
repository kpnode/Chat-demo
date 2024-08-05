const User = require("./../Models/M_user");
const chat = require("./../Models/M_chat");
const room = require("./../Models/M_room");
const conn = require("./../DB/conn");
const moment = require('moment');

// const signUp=async(req,res) => {
//     const {
//         name,
//         email,
//         password,
//     }=req.body;
//     const random_number = Math.floor(Math.random() * 6) + 1;
//     console.log(random_number);
//     let profile = `https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-chat/ava${random_number}-bg.webp`

//     const data={
//         name:name,
//         picture:profile,
//         email:email,
//         password:password
//     }
//     const checkUser=await User.findOne({ email});
//     if(checkUser){
//         res.render('sign_up',{notification:"Email already registered",mcolor:"danger",formData: req.body});
//     }
//     else{
//         const userdata = await User.create(data);
//         req.session.user = userdata;
//         req.session.toast = true;
//         res.redirect('/');
//     }
// }

const login=async(req,res) => {
    const {
        email,
        password,
    }=req.body;
    const data={
        email:email,
        password:password
    }
    const userdata = await User.find(data);
    if(userdata.length==1){
        req.session.user = userdata;
        req.session.toast = true;
        res.redirect("/");
    }else{
        res.render('login',{notification:"Invalid credentials",mcolor:"danger"});
    }
}

const verifyUser=async(req,res) => {  
    const user= req.session.user
    if(user==undefined){
        // res.render('login',{notification:"you have to login first",mcolor:"danger"});
        // req.session.myData = { message: 'Hello from Node.js!' };
        res.redirect("/login");
    }
    else{
        if(user.length==1){
            const loginuser = await User.findById({ _id: user[0]._id });
            const lastMessagedUser = await room.find({
                $or: [
                    { user_id: user[0]._id },
                    { other_user_id: user[0]._id }
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
            }).filter(item => item.id !== user[0]._id.toString());

            uniqueLastMessagedUserInfo.sort((a, b) => b.updatedAt - a.updatedAt);

            const uniqueLastMessagedUserIds = uniqueLastMessagedUserInfo.map(item => item.id);

            const allUsers = await User.find({ _id: { $ne: user[0]._id } });

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
                const count = await chat.countDocuments({ sender_id: otherUser._id, receiver_id: user[0]._id, isRead: false });
                return { userId: otherUser._id, count };
            }));

            if (req.session.toast) {
                delete req.session.toast;   
                res.render("index", { user: loginuser, Alluser: sortedAllUsers, unreadCounts,MessageData, notification: "Successfully Login", mcolor: "success" });
            } else {   
                res.render("index", { user: loginuser, Alluser: sortedAllUsers, unreadCounts,MessageData, notification: "", mcolor: "" });
            }
        }
        else{
            const signeduser = await User.findById({ _id: user._id });

            const lastMessagedUser = await room.find({
                $or: [
                    { user_id: user._id },
                    { other_user_id: user._id }
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
            }).filter(item => item.id !== user._id.toString());

            uniqueLastMessagedUserInfo.sort((a, b) => b.updatedAt - a.updatedAt);

            const uniqueLastMessagedUserIds = uniqueLastMessagedUserInfo.map(item => item.id);
               
               const allUsers = await User.find({ _id: { $ne: user._id } });

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
                    const count = await chat.countDocuments({ sender_id: otherUser._id, receiver_id: user._id, isRead: false });
                    return { userId: otherUser._id, count };    
                }));

                if(req.session.toast){     
                    delete req.session.toast;           
                    res.render("index",{user:signeduser,Alluser:sortedAllUsers,unreadCounts,MessageData,notification:"Account Successfully created",mcolor:"success"});
                }
                else{
                    res.render("index",{user:signeduser,Alluser:sortedAllUsers,unreadCounts,MessageData,notification:"",mcolor:""});
                }
        }
    }
}

const saveChat=async(req, res) => {
    try {
        const {
            sender_id,
            receiver_id,
            msg
        }=req.body
        const data={
            sender_id:sender_id,
            receiver_id:receiver_id,
            msg:msg
        }
        const chatdata = await chat.create(data);
        res.status(200).send({success:true,data :chatdata});
        // res.render("index",{user:"",Alluser:"",notification:"Message Sent Successfully",mcolor:"success"});

    } catch (error) {
        res.render("index",{user:"",Alluser:"",notification:"Something gone Wrong",mcolor:"danger"});
    }
}

const deleteChat=async(req, res) => {
    try {
        const id = req.body.id
        const chatdata = await chat.findById({_id:id});
        const deleteChat = await chat.deleteOne({_id:id});
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
              { sender_id: data.sender_id, receiver_id: data.receiver_id },
              { sender_id: data.receiver_id, receiver_id: data.sender_id },
            ],
          }).sort({created_at:-1});
        res.status(200).send({success:true});

    } catch (error) {
        res.render("index",{user:"",Alluser:"",notification:"Something gone Wrong to delete chat",mcolor:"danger"});
    }
}

const editChat=async(req, res) => {
    try {
        const{
            id,
            msg
        }=req.body;
        const chatdata = await chat.updateOne({_id:id},{$set:{msg:msg}});
       res.status(200).send({success:true,msg:msg,id:id});
    } catch (error) {
        res.render("index",{user:"",Alluser:"",notification:"Something gone Wrong to edit chat",mcolor:"danger"});
    }
}

const updateProfile=async(req, res) => {
    try {
        let data
        if(req.body.name){
            data={name:req.body.name}
        }
       else  if(req.body.email){
            data={email:req.body.email}
            const checkUser=await User.findOne({data});
            if(checkUser){
                res.render('/',{notification:"Email already registered",mcolor:"danger"});
            }
        }
        else if(req.body.caption){
            data={caption:req.body.caption}
        }
       else  if(req.body.password){
            data={password:req.body.password}
        }
            const userdata = await User.updateOne({ _id:req.session.user[0]._id }, data);
            const updateduser= await User.findById({_id:req.session.user[0]._id})
            res.status(200).send({data:updateduser,success:true});

    } catch (error) {
        res.render("index",{user:"",Alluser:"",notification:"Something gone Wrong",mcolor:"danger"});
    }
}

module.exports = {
    // signUp,
    login,
    verifyUser,
    saveChat,
    deleteChat,
    editChat,
    updateProfile,
};