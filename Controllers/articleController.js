const cloudinary = require('../CloudinaryConfig/CloudinaryConfig')
const readingTime = require('reading-time');
const ArticleData = require('../Models/articleModel')
const UserData = require('../Models/userModel')
const jwt = require('jsonwebtoken');
const moment = require('moment');

const author = {
   path: 'author',
   select: '_id username profilePic email createdAt'
}

// upload article image 
exports.uploadArticleImg = async(req, res, next) => {
   const image = req.file
   try {
      const uploadedPostImg = await cloudinary.uploader.upload(image.path)
      if (uploadedPostImg) {
         res.send({postImgUrl: uploadedPostImg})
      }
   } catch (error) {
      res.status(500).send({error: 'Server Error, Please try again'})
   }
}

// upload article thumbnail image 
exports.uploadArticleThumbnail = async(req, res, next) => {
   const image = req.file
   try {
      const thumbnailUrl = await cloudinary.uploader.upload(image.path)
      if (thumbnailUrl) {
         res.send(thumbnailUrl)
      }
   } catch (error) {
      res.status(500).send({error: 'Server Error, Please try again'})
   }
}

// post article  
exports.postArticle = async(req, res, next) => {
   const {title, articleThumbnail, body, searchTags} = (req.body)
   const tags = searchTags.split(',')
   const readTime = readingTime(body).text

   try {
      const article = new ArticleData({
         title, 
         articleThumbnail, 
         body,
         author: req.user._id,
         tags,
         readTime,
         likes: [],
         dislikes: [],
         comments: [],
      })
      let savedArticle = await article.save()
      
      if (savedArticle) {
         const createdArticle = await ArticleData.findOne({_id: savedArticle._id}).populate(author)
         const updatedUser = await UserData.findByIdAndUpdate(
            req.user._id, 
            {
               $push: {posts: savedArticle._id}
            },
            {new: true}
         )
         res.send({createdArticle, updatedUser, success: 'Article Successfully Posted'})
      }
   } catch (error) {
      res.status(500).send({error: 'Server Error, Please try again'})
   }
}

// edit article  
exports.editArticle = async(req, res, next) => {
   const {title, articleThumbnail, body, searchTags} = (req.body)
   const tags = searchTags.split(',')
   const readTime = readingTime(body).text

   try {
      const updatedArticle = await ArticleData.findOneAndUpdate(
         {author: req.user._id}, 
         {
            $set:{
               title, 
               articleThumbnail, 
               body,
               tags,
               readTime,
            }
         },
         {new: true}
      ).populate(author)
      res.send({updatedArticle, success: 'Article Successfully Edited'})
   } catch (error) {
      res.status(500).send({error: 'Server Error, Please try again'})
   }
}

// To delete articles
exports.deleteArticle = async (req, res, next) => {
   const {postId} = req.params
   try {
      const article = await ArticleData.findOne({
         _id:postId, 
         author:req.user._id
      })
      if (article) {
         const deletedArticle = await article.remove()
         const updatedUser = await UserData.findByIdAndUpdate(
            req.user._id,
            {
               $pull: {posts: deletedArticle._id}
            },
            {new: true}
         )
         res.send({deletedArticle, updatedUser, success:'Article Successfully Deleted'})
      }else{
         res.status(400).send({error:"You are not author of this article"})
      }
   } catch (error) {
      res.status(500).send({error: 'Server Error, Please try again'})
   }
}

// To get all articles
const getDate = (days) => {
   let date = moment().subtract(days, 'days')
   return date.toDate()
} 
const generateFilterObject = (filterData) => {
   let filterObj = {};
   let order = 1;
   switch (filterData) {
      case 'latest': {
         filterObj = {
            createdAt: {
               $gt: getDate(15)
            } 
         };
         order=1
         break
      }
      case 'week': {
         filterObj = {
            createdAt: {
               $gt: getDate(7)
            } 
         };
         order=1
         break
      }
      case 'month': {
         filterObj = {
            createdAt: {
               $gt: getDate(30)
            } 
         };
         order=1
         break
      }
      case 'all': {
         order= -1
         break
      }
   }

   return {
      filterObj,
      order
   }
}

// Get All Article
exports.getHomeArticles = async (req, res, next) => {
   const {filter, pageNo} = req.params
   const currentPage = parseInt(pageNo) || 1;
   const articlePerPage = 3;
   const {filterObj, order} = generateFilterObject(filter)
   try {
      const totalArticles = await ArticleData.find(filterObj)
      const totalPage = Math.ceil(totalArticles.length / articlePerPage);
      const homeArticles = await ArticleData.find(filterObj)
      .sort(order === 1 ? '-createdAt' : 'createdAt')
      .skip((articlePerPage * currentPage) - articlePerPage)
      .limit(articlePerPage)
      .populate(author)
      
      res.send({homeArticles, totalPage, currentPage})
   } catch (error) {
      res.status(500).send({error: 'Server Error, Please try again'})
   }
}

// Get All Article
exports.getAllArticle = async (req, res, next) => {
   try {
      const allArticles = await ArticleData.find()
      .populate(author)

      res.send(allArticles)
   } catch (error) {
      res.status(500).send({error: 'Server Error, Please try again'})
   }
}