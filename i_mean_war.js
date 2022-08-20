// Assalamualikum , Made Possible by help of other 
// Check out https://github.com/DwiRizqiH , i took a lot of the code from him
// and help in discord , shout out to clonerxyz#0061 on discord for helping mee
// and DwiRizqi#3849


const {
    default: makeWASocket,
    fetchLatestBaileysVersion,
    useSingleFileAuthState,
    DisconnectReason,
    makeInMemoryStore,
    generateWAMessageFromContent, 
    proto,
    MessageType,
    downloadMediaMessage
} = require('@adiwajshing/baileys')

const auth_file = './auth_info.json'
const { state, saveState } = useSingleFileAuthState(`${auth_file}`)
const { createSticker, StickerTypes, default: Sticker } = require('wa-sticker-formatter')
const { exec } = require("child_process")
const ffmpeg = require('ffmpeg');
const str_replace = require('str_replace');
const fs = require('fs');
const writeFile = require('fs/promises');

const start = async () => {
    // const { version } = await fetchLatestBaileysVersion()
    let ws = makeWASocket({ printQRInTerminal: true, auth: state, defaultQueryTimeoutMs: undefined })


    // start now

    console.log('------------------------------------------------')
    console.log('Baileys BOT')
    console.log('------------------------------------------------')
    console.log('[DEV] SkyUnik')
    console.log('[SERVER] Server Started! \n')

    ws.ev.on('creds.update', saveState)

    
    ws.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update
        if(connection == 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
            if(lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut) {
                console.log('- connection closed, reconnecting...')
                if(shouldReconnect) {
                    start()
                }
            } else {
                console.log('+ connection closed', lastDisconnect.error, ', reconnecting ', shouldReconnect)
            }
        } else if(connection === 'open') {
            console.log('opened connection')
        }
    })



    ws.ev.on('messages.upsert', async (chatUpdate) => {
        const mine_number = '6289684314433@s.whatsapp.net'
        let message = chatUpdate.messages[0]
        let messageRaw = chatUpdate.messages[0]
        // if (message.key && message.key.remoteJid == 'status@broadcast') return
        if (!message) return
        if (message.key && message.key.remoteJid == 'status@broadcast') return
        if (message.key.fromMe == true) return



        const reply = async (from, teks) => {
            await ws.sendPresenceUpdate('composing', from)
            return await ws.sendMessage(from, { text: teks }, { quoted: message })
        }

        const sendText = async (from, teks) => {
            return await ws.sendMessage(from, { text: teks })
        }
        const deleteMessage = async (from, cret) => {
            let keys = cret.quotedMsg
            if (keys != undefined && keys.fromMe != undefined && keys.fromMe == true) {
                await ws.sendMessage(from, { delete: { remoteJid: keys.sender, fromMe: true, id: keys.id, participant: ws.user.id } })
            } else if (cret.quotedMsg == false) {
                await reply(cret.from, 'I only can delete my own messages')
            }
        }

        const sendMessageWTypingReply = async(jid, msg) => {
            await ws.presenceSubscribe(jid)
    
            await ws.sendPresenceUpdate('composing', jid)
    
            await ws.sendPresenceUpdate('paused', jid)

            await reply(jid, msg)
        }
        
        message = require('./Message_format.js')(ws, message)
        console.log(message);
        console.log(message.body);
        const groupMetadata = message.isGroupMsg ? await ws.groupMetadata(message.from) : ''
        const groupMembers = message.isGroupMsg ? groupMetadata.participants : ''
        const groupAdmins0 = message.isGroupMsg ? groupMembers.filter(admn => admn.admin != null) : ''
        const groupAdmins = message.isGroupMsg ? groupAdmins0.map(admn2 => admn2.id) : ''
        let isGroupAdmins = message.isGroupMsg ? groupAdmins.includes(message.sender) : false
        let isMeGroupAdmins = message.isGroupMsg ? groupAdmins.includes(mine_number) : false
        if (!message.body == null) return
        // if (!message.hasNewMessage) return


        if(message.body == '!reply') {
            await reply(message.from, 'Hi , Im Replying')
        }

        if(message.body == '!delete') {

            const deleteu = deleteMessage(message.from, message)
            // const delyes = reply(message.from, 'Im Deleting That.')
            
            // console.log('delete :', deleteu)
        }

        if(message.body == '!sticker') {
            console.log('This is sticker !') 
            if (message.quotedMsg != false && message.quotedMsg.isMedia != false || message.isMedia != false ) {
                console.log('Detected an Image');
                await ws.sendPresenceUpdate('composing', message.from)
                const mediaData = message.quotedMsg ? await message.quotedMsg.getMedia() : message.messageContent ? await downloadMediaMessage(message, 'buffer', { }) : ''
                const stickerOptions = new Sticker(mediaData, {
                    pack: 'Sticker Made By WhatsappBot Fatih V2', // pack name
                    author: 'Whatsapp JS V2', // author name
                    categories: ['🎉'],
                    type: StickerTypes.CROPPED, // sticker type
                    quality: 100, // quality of the output file
                })
                // const buffer = await stickerOptions.toBuffer()
                await ws.sendMessage(message.from, await stickerOptions.toMessage() , {quoted: message})
            }

            else { reply(message.from, 'There is not an image , please send with image or replied an image') }
        } 

        if(message.body == '!everyone') {
            await ws.sendPresenceUpdate('composing', message.from) 
            if(isGroupAdmins) {
                const group_all = await ws.groupMetadata(message.from)
                const participante = group_all.participants
                console.log(group_all);
                let texte = "";
                let mentionse = [];
                let listo = [];

                for(let participant of group_all.participants) {
                    const contact = participant.id;

                    listo.push(participant);
                    mentionse.push(contact);
                    const sume = contact.split('@s.whatsapp.net')
                    const memey = sume[0]
                    texte += `@${memey} `;
                }
                const sentMsg  = await ws.sendMessage(message.from, { text: texte, mentions: mentionse })
            }
            else if (!isGroupAdmins) {
                await ws.sendPresenceUpdate('composing', message.from) 
                const group_all = await ws.groupMetadata(message.from)
                const participante = group_all.participants
                console.log(group_all);

                const splet = message.sender.split('@s.whatsapp.net')
                let texte = `@${splet} Tagged you :\n`;
                let mentionse = [];
                let listo = [];

                for(let participant of group_all.participants) {
                    const contact = participant.id;

                    listo.push(participant);
                    mentionse.push(contact);
                    const sume = contact.split('@s.whatsapp.net')
                    const memey = sume[0]
                    texte += `@${memey} `;
                }
                const sentMsg  = await ws.sendMessage(message.from, { text: texte, mentions: mentionse })
                // await reply(message.from, 'This is admin only command , only admin can use this.')
            }
        }

        if(message.body == '!code') {
            await ws.sendPresenceUpdate('composing', message.from) 
            if(isMeGroupAdmins) {
                const code = await ws.groupInviteCode(message.from)
                const send_code = reply(message.from, `Scraping your group ... \nhttps://chat.whatsapp.com/${code}`)
            }
            else if (!isMeGroupAdmins) {
                await ws.sendPresenceUpdate('composing', message.from) 
                await reply(message.from, 'Im not and admin , i cant do that , only admin can use this.')
            }
        }
        if(message.body == '!joke') {
            await ws.sendPresenceUpdate('composing', message.from) 
            const axios = require('axios');

            async function axiosTest() {
                const response = await axios.get('https://candaan-api.vercel.app/api/text/random')
                return response.data
            }

            const responde = await axiosTest()
            await reply(message.from, `☀️*Kata - Kata Jokes*☀️:\n_${responde.data}_`)
        }
    })
}

start()