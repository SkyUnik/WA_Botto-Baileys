const {
    default: makeWASocket,
    fetchLatestBaileysVersion,
    // useSingleFileLegacyAuthState,
    DisconnectReason,
    // makeInMemoryStore,
    // generateWAMessageFromContent, 
    // proto,
    MessageType, 
    MessageOptions, 
    Mimetype,
    downloadContentFromMessage,
    downloadMediaMessage,
    useMultiFileAuthState
    // Browsers
} = require('@adiwajshing/baileys')

const { exec } = require('node:child_process');

const { createSticker, StickerTypes, default: Sticker } = require('wa-sticker-formatter')
const str_replace = require('str_replace')
const writeFile = require('fs/promises');
const util = require('util')
const pino = require('pino')
const owner = '6281382519681@s.whatsapp.net'
const fs = require('fs');
const { writeFileSync } = require('node:fs');
const path = require('node:path');
const prefix = '!'  // Prefix to be use can be '!' or '.' etc

function containsWhitespace(str) {
    return /\s/.test(str);
};

function removeFirstWord(str) {
    const indexOfSpace = str.indexOf(' ');

    return str.substring(indexOfSpace + 1);
}

function jsonReader(filePath, cb) {
    fs.readFile(filePath, (err, fileData) => {
        if (err) {
        return cb && cb(err);
        }
        try {
        const object = JSON.parse(fileData);
        return cb && cb(null, object);
        } catch (err) {
        return cb && cb(err);
        }
    });
}

async function start() {
    const { version, isLatest } = await fetchLatestBaileysVersion();
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    const desiredversion = [ 2, 22, 19, 78 ]
    let ws = makeWASocket({
		version,
		printQRInTerminal: true,
		auth: state,
		//msgRetryCounterMap,
        // browser: Browsers.macOS('Desktop'),
		logger: pino({ level: 'silent'})})


    const baileysversion = version.join('.');
    console.log('------------------------------------------------');
    console.log('Baileys BOT');
    console.log('------------------------------------------------');
    console.log("[AVAILABLE]");
    console.log("[VERSION] " + baileysversion);
    console.log("[LATEST] : " + isLatest);
    console.log('------------------------------------------------');
    console.log('[DEV] SkyUnik');
    console.log('[SERVER] Server Started! \n');

    ws.ev.on('creds.update', saveCreds)

    ws.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
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
        console.log(`[RECEIVED] : ${Object.keys(chatUpdate.messages).length}`);
        if (chatUpdate.messages[0]) {
            //result message income
            const messageRaw = chatUpdate.messages[0]
            let message = messageRaw
    
            // Return if statement
            if (!message) return
            if (message.key && message.key.remoteJid == 'status@broadcast') return
            if (message.key.fromMe == true) return

            //Formatting
            message = require('./Message_format.js')(ws, messageRaw)
            if (message.body === undefined) return
            // console.log(message)

            // Ternary Operators to check if the sender is a group and is admin
            const groupMetadata = message.isGroupMsg ? await ws.groupMetadata(message.from) : ''
            const groupMembers = message.isGroupMsg ? groupMetadata.participants : ''
            const groupAdmins0 = message.isGroupMsg ? groupMembers.filter(admn => admn.admin != null) : ''
            const groupAdmins = message.isGroupMsg ? groupAdmins0.map(admn2 => admn2.id) : ''
            const isGroupAdmins = message.isGroupMsg ? groupAdmins.includes(message.sender) | message.sender.includes(owner) : false
            
            const msgbody = message.body
            if (msgbody.startsWith(prefix)) {
            await ws.readMessages([message.key])
            // Declare some important variable
            let command = containsWhitespace(msgbody) ? msgbody.replace(/^\s+|\s+$/g, '').split(/\s+/)[0] : msgbody
            let argument = containsWhitespace(msgbody) ? str_replace(command,'', msgbody).replace(/^\s+|\s+$/g, '') : false
            const from = message.from
            const sender = message.sender
            const metadata = await ws.groupMetadata(message.chatId) 
            // const store = makeInMemoryStore({ })
            
            await ws.sendPresenceUpdate('composing', from)

            let notesingroup = []
            const jsonnotesingroup = fs.readFileSync("./datan.json", 'utf-8')
            for (let result of JSON.parse(jsonnotesingroup)) {
                if (result.chatId == message.chatId) {
                    // console.log(result);
                    notesingroup.push(prefix + result.command)
                }}
            if (notesingroup.includes(command)) {
                let argumentnotes
                for (let result of JSON.parse(jsonnotesingroup)) {
                    if (result.chatId == message.chatId) {
                        // console.log(result);
                        // console.log(command);
                        if (prefix + result.command == command) {
                            // console.log('CODE PASSED BOI')
                            // console.log(result.argument);
                            argumentnotes = result.argument
                        }
                }}
            
                await ws.sendMessage(from, {text: util.format(argumentnotes)}, {quoted: message})
                return;
            }
            switch(command.toLowerCase()){
                case prefix + 'run':
                    if (sender == owner) {
                        try {
                            await eval(argument);
                        } catch (err) {
                            console.error(`[CODE_ERROR] : ${err}`);
                            await ws.sendMessage(from, { text: `Error!\n${err}\n${argument}`})
                        }
                    } else {
                        await ws.sendMessage(from, { text: `IM SORRY BUT YOU CANNOT ${prefix}run\nTHIS COMMAND IS ONLY FOR OWNER`})
                    }

                    break
                case prefix + 'reply':
                    await ws.sendMessage(from, { text: `I've Been told to: ${command}` }, { quoted: message })
                    break
                case prefix + 'sme': // sme a.ka send to me
                if (sender == owner) {
                    await ws.sendMessage(owner, { text: util.format(message) })
                    await ws.sendMessage(from, { text: 'Done'}, { quoted: message })
                } else {
                    await ws.sendMessage(from, { text: 'No'}, { quoted: message })
                }
                    break
                case prefix + 'notes':
                    let notesgrupj = []
                    let somenotestehre = []
                    for (let result of JSON.parse(jsonnotesingroup)) {
                        somenotestehre.push(result.chatId == message.chatId)
                        if (result.chatId == message.chatId) {
                            // console.log(result);
                            notesgrupj.push({title: prefix + result.command})
                        }}
                    // console.log(notesgrupj);
                    if (!somenotestehre.includes(true)) {
                        ws.sendMessage(from, {text: `There isn't any notes in here.\nGroup Name: *${metadata.subject}*\nNotes: NONE\n${prefix}addnotes to add notes..`}, {quoted: message})
                        return;
                    }
                    
                    const sections = [
                        {
                        title: "Notes",
                        rows: notesgrupj
                        },
                    ]
                    
                    
                    const listMessage = {
                        text: `Group Name: *${metadata.subject}*\n${notesingroup.join('\r\n')}`,
                        // footer: notesingroup.join('\r\n'),
                        title: "Daftar Saved Notes",
                        buttonText: "NOTES",
                        sections
                        }
                    ws.sendMessage(from, listMessage, {quoted: message})
                    break
                case prefix + 'addnotes':
                    let news = []
                    let hasinit = []
                    const commandnotes = argument != false ? argument.split(/\s+/)[0] : null
                    if (commandnotes === null) {
                        ws.sendMessage(from, {text: "Please Give an Argument."}, {quoted: message})
                        return;
                    }
                    const notesargument = commandnotes != null ? removeFirstWord(argument) : null

                    for (let result of JSON.parse(jsonnotesingroup)) {
                        if (result.chatId == message.chatId) {
                            // console.log(result);
                            hasinit.push(result.command == commandnotes)
                        }}
                    if (hasinit.includes(true)) {
                        ws.sendMessage(from, {text: `There is Already Notes By the name of ${prefix+commandnotes}.`}, {quoted: message})
                        return;
                    }

                    jsonReader("./datan.json", (err, datan) => {
                        if (err) {
                        console.log("Error reading file:", err);
                        return;
                        }
                        if(typeof datan !== 'undefined'){
                        const jsondata = 
                        {"chatId": message.chatId, "id": message.id, "command" : commandnotes, "argument": notesargument}
                        // {"chatid": "something@ilham.sus", "id": "69", "argument": "im over ehre"}

                        datan.push(jsondata)
                        fs.writeFile("./datan.json", JSON.stringify(datan, null, 2), err => {
                        if (err) console.log("Error writing file:", err);
                        try { 
                            jsonReader("./datan.json", (err, datan) => { 
                            ws.sendMessage(from, {text: util.format(jsondata)})
                        })
                        } catch (err) {
                        ws.sendMessage(from, {text: 'failed reading file'})
                        return; 
                        }});
                    }});

                    // for(let Ndatas of datan) {
                    
                    //   listo.push(participant);
                    //   mentionse.push(contact);
                    //   const sume = contact.split('@s.whatsapp.net')
                    //   const memey = sume[0]
                    //   texte += `@${memey} `;
                    // }
                    break
                case prefix + 'delnotes' :
                let delhasinit = []
                const comandemen = argument != false ? argument.split(/\s+/)[0] : null
                if (comandemen === null) {
                    ws.sendMessage(from, {text: "Please Give an Argument."}, {quoted: message})
                    return;
                }
                for (let result of JSON.parse(jsonnotesingroup)) {
                    if (result.chatId == message.chatId) {
                        // console.log(result);
                        delhasinit.push(result.command == comandemen)
                    }}
                // console.log(delhasinit);
                if (!delhasinit.includes(true)) {
                    ws.sendMessage(from, {text: `There isn't any Notes in this group By the name of ${prefix+comandemen}.`}, {quoted: message})
                    return;
                }
                // console.log(comandemen);
                let filtered = JSON.parse(jsonnotesingroup).filter(function(el) { return el.command != str_replace(prefix,'', comandemen); });
                fs.writeFile("./datan.json", JSON.stringify(filtered, null, 2), err => {
                if (err) console.log("Error writing file:", err);
                try { 
                    jsonReader("./datan.json", (err, datan) => { 
                    ws.sendMessage(from, {text: "Done."})
                })
                } catch (err) {
                ws.sendMessage(from, {text: 'failed reading file'})
                return; 
                }});
                    break
                case prefix + 'everyone': 
                const group_all = await ws.groupMetadata(from)
                // const participante = group_all.participants
                // console.log(group_all);

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
                await ws.sendMessage(from, { text: texte, mentions: mentionse })
                    break
                case prefix + 'sticker':
                    if (message.quotedMsg ? message.quotedMsg.isMedia : message.isMedia == true) {
                        const name = 'sticker-img';
                        const pathget =  message.message.imageMessage ? message.message.imageMessage.mimetype : message.message.videoMessage ? message.message.videoMessage.mimetype : message.quotedMsg ? message.quotedMsg.mimetype : null
                        const size = message.message.videoMessage ? message.message.videoMessage.fileLength : message.quotedMsg ? message.quotedMsg.fileLength : null
                        // console.log(size > 5000000);
                        // console.log(pathget);
                        if ( size > 5000000) {
                            await ws.sendMessage(from, {text: `kegedean mas file nya\nmax nya 5mb doang`}, {quoted: message})
                            return
                        }
                        const mediaData = message.quotedMsg.isMedia ? await message.quotedMsg.getMedia() : message.isMedia ? await downloadMediaMessage(
                            message,
                            'buffer',
                            { },
                            { 
                                //logger,
                                // pass this so that baileys can request a reupload of media
                                // that has been deleted
                                reuploadRequest: ws.updateMediaMessage
                            }
                        ) : null
                        // console.log(mediaData);
                        if (pathget.includes('video')) {
                        
                        // const path = str_replace('image/', '', pathget);
                        const pathclean = str_replace('video/', '', pathget);
                        
                        // save to file
                        writeFileSync(`./${name}.${pathclean}`, mediaData)
                        const folder = ('./')
                        exec('ffmpeg -i '+folder+name+'.'+pathclean+' -t 3s -v quiet -vcodec libwebp -filter:v fps=fps=20 -lossless 0  -compression_level 3 -q:v 70 -loop 1 -preset picture -an -vsync 0 '+folder+name+'.webp', async(error, stdout, stderr) => {
                            if (error) {
                                console.log(`error: ${error.message}`);
                                //return;
                            }
                            if (stderr) {
                                console.log(`stderr: ${stderr}`);
                                //return;
                            }
                            const filesticker = fs.readFileSync(`./${name}.webp`)
                            const stickerOptions = new Sticker(filesticker, {
                                        pack: 'STICKERS', // pack name
                                        author: 'Bot WA Fatih V2', // author name
                                        type: StickerTypes.CROPPED, // sticker type
                                        quality: 100, // quality of the output file
                                    })
                                    // const buffer = await stickerOptions.toBuffer()
                            await ws.sendMessage(from, await stickerOptions.toMessage() , {quoted: message})
                            // fs.unlinkSync(`./${name}.webp`, `./${name}.${pathclean}`)
        
                        })

                        //await delay(6000)
                    }

                    const stickerimg = new Sticker(mediaData, {
                                        pack: 'STICKERS', // pack name
                                        author: 'Bot WA Fatih V2', // author name
                                        type: StickerTypes.CROPPED, // sticker type
                                        quality: 100, // quality of the output file
                                    })
                                    // const buffer = await stickerOptions.toBuffer()
                    await ws.sendMessage(from, await stickerimg.toMessage() , {quoted: message})
                    
                    } else {
                        ws.sendMessage(from, { text: `Itu bukan gambar... kirimin gambar mazzeh` }, { quoted: message })
                    }
                    break
                default:
                    // console.log(command);
                    // console.log(notesingroup);
                    // console.log(notesingroup.includes(command));
                    await ws.sendMessage(from, { text: `${command} COMMAND is not in a condition block...` }, { quoted: message })
                 // code
              }}
        
        }
    })
}
start()