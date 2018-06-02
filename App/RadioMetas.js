const axios = require('axios')
const convert = require('xml-js')
const moment = require('moment')
class RadioMetas {

  /**
  **/
  constructor(params = {}) {
    this.params = params
    this.params.radioUid = process.env.RADIONOMY_RADIO_UID
    this.params.timeout = 99999999
  }

  getDeezerCover(track, size = "120x120"){
    return new Promise((resolve, reject) => {
      axios.get("https://api.deezer.com/search?q=" + track.title + " " + track.artists).then((response) => {
        resolve(response.data.data[0].album.cover_small.replace('56x56', size))
      }).catch((error) => {
        reject(error)
      })
    })
  }

  getMetas() {
    return new Promise((resolve, reject) => {
      axios.get("http://api.radionomy.com/currentsong.cfm?radiouid=" + this.params.radioUid + "&type=xml&cover=yes&defaultcover=yes&size=90&dynamicconf=yes", {timeout: this.params.timeout}).then(response => {
          var parsedResponse = convert.xml2js(response.data).elements[0].elements[5].elements;
          var track = {
              unique_id: parsedResponse[0].elements[0].text,
              title: parsedResponse[1].elements[0].text,
              artists: parsedResponse[2].elements[0].text,
              start_time: parsedResponse[3].elements[0].text,
              play_duration: parsedResponse[4].elements[0].text,
              current: parsedResponse[5].elements[0].text,
              cover: parsedResponse[6].elements[0].text,
          }
          //get the duration of the track and the end in
          var end_at = moment(track.start_time).add(track.play_duration, "ms")
          var end_in = end_at.diff(moment())

          if (track.title == "Advert:TargetSpot") {

            resolve({
              success: true,
              track: {
                cover: ""
              },
              end_in: end_in,
              is_ad: true
            })
          }else{

            this.getDeezerCover(track).then((cover) => {
              track.cover = cover
              resolve({
                success: true,
                track: track,
                end_in: end_in,
                is_ad: false
              })
            }).catch((error) => {
              reject(error)
            })
          }
      }).catch((error) => {
          reject({
            success: false,
            error: error
          })
      });
    });
  }
}

module.exports = RadioMetas
