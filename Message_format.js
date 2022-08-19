"use strict";

const { downloadContentFromMessage } = require('@adiwajshing/baileys')
let mediaType = ["imageMessage","videoMessage","stickerMessage","audioMessage"]

module.exports = (rem, messageRaw) => {
    if(messageRaw == undefined) return {}
    if(messageRaw?.message == undefined) return messageRaw
    let message = messageRaw
    //if(messageRaw.message.ephemeralMessage != undefined) message = messageRaw.message.ephemeralMessage
    message.t = message.messageTimestamp
    message.id = message.key.id
    message.from = message.key.remoteJid
    message.fromMe = message.key.fromMe
    message.chatId = message.from
    message.isGroupMsg = message.from.endsWith("@g.us")
    message.sender = message.isGroupMsg ? message.key.participant.split(':')[0] : message.fromMe ? rem.user.id.split('@')[0].split(':')[0] + '@s.whatsapp.net' : message.from.split(':')[0]
    message.sender = message.sender.split('@s.whatsapp.net')[0] + '@s.whatsapp.net'
    message.pushname = message.pushName
    message.timestamp = message.messageTimestamp
    message.isEphemeralMessage = false
    message.type = Object.keys(message?.message)[0]
    if(message.type == 'messageContextInfo' || message.type == 'senderKeyDistributionMessage' || message.type == 'viewOnceMessage') {
        if(message.type == 'viewOnceMessage') {
            message.type = Object.keys(message.message.viewOnceMessage.message)[0]+'_viewOnce'
        } else {
            message.type = Object.keys(message.message)[1]
        }
        if(message.type == 'messageContextInfo' || message.type == 'senderKeyDistributionMessage' ) {
            message.type = Object.keys(message.message)[2]
        }
    } else {
        message.type = Object.keys(message.message)[0]
    }
    if(message.type == "ephemeralMessage") {
        message.isEphemeralMessage = true
        message.message = messageRaw.message.ephemeralMessage.message
        message.type = Object.keys(message.message)[0]
    }
    message.messageContent = message.message[message.type]
    message.isMedia = mediaType.includes(message.type)
    message.type == 'templateButtonReplyMessage' ? message.selectedButtonId = message.message.templateButtonReplyMessage.selectedId : message.type == 'buttonsResponseMessage' ? message.selectedButtonId = message.message.buttonsResponseMessage.selectedButtonId : ''
    if(message.type == 'templateButtonReplyMessage') message.selectedButtonIndex = message.message.templateButtonReplyMessage.selectedIndex
    if(message.type == 'listResponseMessage') message.selectedRowId = message.message.listResponseMessage.singleSelectReply.selectedRowId
    if(message.isMedia) message.getMedia = async () => {
        const stream = await downloadContentFromMessage(message.message[message.type], message.type.replace('Message', ''))
        let buffer = Buffer.from([])
        for await(const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk])
        }
        return buffer
    }
    if(message.isMedia) message.mimetype = message.message[message.type].mimetype
    message.isMedia ? message.message[message.type].caption : ""
    if(message.isMedia && (message.type === "audioMessage" || message.type === "videoMessage")) message.duration = message.message[message.type].seconds
    message.quotedMsg = message.message.contextInfo ? message.message.contextInfo.quotedMessage : message.message[message.type].contextInfo ? message.message[message.type].contextInfo.quotedMessage : false //message.type === "buttonsResponseMessage" && message.message[message.type].contextInfo ? message.message[message.type].contextInfo.quotedMessage : message.type === MessageType.extendedText && message.message[message.type].contextInfo ? message.message[message.type].contextInfo.quotedMessage : message.message.contextInfo ? message.message.contextInfo.quotedMessage : false
    message.mentionedJidList = message.message.contextInfo ? message.message.contextInfo.mentionedJid : message.message[message.type].contextInfo ? message.message[message.type].contextInfo.mentionedJid : []
    if(message.quotedMsg) {
        let type = Object.keys(message.quotedMsg)[0]
        let quetod = message.message[message.type].contextInfo
        quetod.message = quetod.quotedMessage
        message.quotedMsg = message.quotedMsg[type]
        if(typeof message.quotedMsg === "string") message.quotedMsg = { text: message.quotedMsg }
        message.quotedMsg.type = type
        message.quotedMsg.id = message.message[message.type].contextInfo ? message.message[message.type].contextInfo.stanzaId : message.message.contextInfo.stanzaId
        message.quotedMsg.from = message.message[message.type].contextInfo ? message.message[message.type].contextInfo.remoteJid || message.from : message.message.contextInfo.remoteJid || message.from
        message.quotedMsg.sender = message.message[message.type].contextInfo ? message.message[message.type].contextInfo.participant || rem.user.id.split('@')[0].split(':')[0] + '@s.whatsapp.net' : message.message.contextInfo.participant || rem.user.id.split('@')[0].split(':')[0] + '@s.whatsapp.net'
        message.quotedMsg.fromMe = message.quotedMsg.sender === (rem.user && rem.user.id.split('@')[0].split(':')[0] + '@s.whatsapp.net')
        message.quotedMsg.pushname = message.quotedMsg.fromMe ? rem.user.name : ''
        message.quotedMsg.body = type === "templateButtonReplyMessage" ? message.quotedMsg.selectedDisplayText : type === "listMessage" ? message.quotedMsg.description : type === "buttonsMessage" ? message.quotedMsg.contentText : ["listResponseMessage"].includes(type) ? message.quotedMsg.singleSelectReply.selectedRowId : ["buttonsResponseMessage"].includes(type) ? message.quotedMsg.selectedButtonId : message.quotedMsg.caption || message.quotedMsg.conversation || message.quotedMsg.text || ""
        message.quotedMsg.isMedia = mediaType.includes(message.quotedMsg.type)
        if(message.quotedMsg.isMedia) message.quotedMsg.getMedia = async () => {
            let mime = message.quotedMsg.mimetype
            let messageType = mime.split('/')[0].replace('application', 'document') ? mime.split('/')[0].replace('application', 'document') : mime.split('/')[0]
            const stream = await downloadContentFromMessage(message.quotedMsg, messageType)
            let buffer = Buffer.from([])
            for await(const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk])
            }
            return buffer
        }
        message.quotedMsg.mentions = message.quotedMsg.contextInfo ? message.quotedMsg.contextInfo.mentionedJid : []
        message.quotedMsg.reply = (text) => rem.sendMessage(message.quotedMsg.from, { text: text }, { quetod })
    }
    //let tmpBodyCheck = message.message[message.type]
    //message.body = message.message.conversation != undefined ? message.message.conversation : message.type === "templateButtonReplyMessage" ? message.message[message.type].selectedDisplayText : message.type === "listMessage" ? message.message[message.type].description : message.type === "buttonsMessage" ? message.message[message.type].contentText : message.type === "listResponseMessage" ? message.message[message.type].singleSelectReply.selectedRowId : message.type === "buttonsResponseMessage" ? message.message[message.type].selectedDisplayText : message.type === "conversation" ? message.message.conversation : message.message[message.type].text != undefined ? message.message[message.type].text : message.isMedia ? message.message[message.type].caption : message.message.extendedTextMessage != undefined ? message.message.extendedTextMessage.text : ""
    message.body = message.message.conversation || message.message[message.type].text || message.message[message.type].caption || message.message[message.type].selectedDisplayText || message.message[message.type].selectedDisplayText || message.message[message.type].description || message.message[message.type].contentText //|| message.message[Object.keys(message.message)[0]].text || message.message[Object.keys(message.message)[1]].text
    message.reply = (text) => rem.sendMessage(message.from, { text: text } , { quoted: message })
    messageRaw = null
    return message
}