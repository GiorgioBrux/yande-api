"use strict"
const request = require("request")
const utils = require("./utils")

const baseURL = "https://yande.re/post?"

/**
 * @param {Int} page
 * @return {Array}  
 * @callback err
 */
function getPostByPageNum(baseURL, page, setCookie) {
    return new Promise ((resolve) => {

        page = (page > 0) ? page : 1

        const URL = baseURL + "&page=" + page
        const headers = utils.createHeaders(setCookie,page);
    
        request({
            method:"GET",
            headers: headers,
            uri: URL
        }, (err, response, html) => {
            if (err) return console.log(err)

            let result = []
    
            /**
             * Tách các row trong html thành một String Array.
             * lọc các đoạn "Post.register" và xử lý để chuyển về dạng JsonObject.  
             */
            html.split("\n")
                .forEach(row => {
                    if (row.indexOf("Post.register(") > -1) {
                        let post = JSON.parse(
                                row.trim().slice("Post.register(".length, row.trim().length-1)
                            )
                        result.push(post)
                    }
                })

            resolve({setCookie: response.headers["set-cookie"], result})    
        })

    })   
}

/**
 * @param {StringArray} tags 
 * @param {StringArray} filter 
 * @param {Int} limit
 * @callback {Object} post
 */
async function getPostData (tags = [], limit = 100,filter = {}, callback) { // default value

    /* thêm tag vào url */
    const URL = baseURL + "&tags=" + tags.join("+")

    let count = 0
    let startPage = 1
    let setCookie = ""
    let result = [];

    (async function get(page, setCookie) {

        let data = await getPostByPageNum(URL, page, setCookie)

        let newCookie = "vote=1; " + data.setCookie.map(el => el.split("; ")[0]).join("; ")

        data= utils.filterPost(data.result, filter) 
        
        data.forEach((post) => {
            if (++count < limit) 
                callback(post)
        })
        if (count < limit)
            get(page+1, newCookie)

    })(startPage, setCookie)

}

module.exports = getPostData