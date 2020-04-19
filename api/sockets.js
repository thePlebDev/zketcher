const cache = require('./data/cache')
const admin_name = 'System'
module.exports = io => {
    io.on('connection', socket => {
        console.log('new connection ' + socket.id)

        // ===================================
        //              SOCKETS
        // ===================================

        socket.on('join', ({ room_id, name }, callback) => {
            const room = cache.rooms.get(room_id)
            if(!room) return callback("The room doesn't exist.")
            
            const {error, user } = cache.users.create({ _id: socket.id, room_id, name })
            if(error || !user) return callback(error)

            for (const { line, opts } of room.line_history) {
                socket.emit('draw_line', { line, opts })
            }
            
            join(user, room)
        })

        socket.on('create_room', (opts, callback) => {
            const {err, room } = cache.rooms.create(opts)
            if(callback) {
                if(err || !room) return callback(err)
                return callback()
            }
        })

        socket.on('send_message', message => {
            const user = cache.users.findOne(socket.id)
            if(!user) return
            const room = cache.rooms.get(user.room_id)

            if(user && room) {
                io.to(user.room_id).emit('message', { user, text: message })
                if(room.is_start && room.host._id != user._id) {
                    if(message.trim().toLowerCase() == room.word.name.trim().toLowerCase()) {
                        user.points += room.time
                        io.to(user.room_id).emit('message', { user: { name: admin_name }, text: `${user.name} guess the word ${room.word.name}!!`, color: '#ffff80' })
                        io.to(user._id).emit('user_data', user)

                        // check ends
                        if(room.words.length == 0 || room.max_rounds - 1 == room.round) {
                            end_game(room)
                        }
                        return next_player(room)
                    }
                    
                }
            }
            
        })


        socket.on('draw_line', ({ line, opts }) => {
            const user = cache.users.findOne(socket.id)
            if(!user) return
            const room = cache.rooms.get(user.room_id)

            if(user && room && room.host && room.is_start) {
                if(room.host._id === user._id) {
                    room.line_history.push({ line, opts })
                    io.to(user.room_id).emit('draw_line', { line, opts })
                }
            }
        })

        socket.on('clear_draw', () => {
            const user = cache.users.findOne(socket.id)
            if(!user) return
            const room = cache.rooms.get(user.room_id)

            room.line_history = []
            io.to(user.room_id).emit('clear_draw')
            return io.to(room._id).emit('room_data', { action: 'clean_draw', room, users: cache.users.findByRoom(room._id) })
        })

        socket.on('start_game', () => {
            start()
        })

        socket.on('disconnect', () => {
            const user = cache.users.delete(socket.id)

            if(user) {
                const room = cache.rooms.get(user.room_id)
                
                if(room.host._id == user._id){
                    next_player(room)
                }
                
                socket.leave(user.room_id)
                io.to(user.room_id).emit('message', { user: { name: admin_name }, text: `${user.name} has left.`, color: '#ffcccc' })
                io.to(user.room_id).emit('room_data', { action: 'leave', room, users: cache.users.findByRoom(user.room_id)})
            }
            console.log(`bye ${user ? user.name : socket.id}`)
        })




        // ===================================
        //         UTILITY METHODS
        // ===================================

        const join = (user, room) => {
            user.room_id = room._id
            socket.join(user.room_id)

            const users = cache.users.findByRoom(user.room_id)

            if(!room.owner) {
                room.owner = user
            }
            if(!room.host) {
                room.host = user
            }

            io.to(user.room_id).emit('room_data', { action: 'join', user, room, users })
            socket.emit('user_data', user)
            io.to(user.room_id).emit('message', { user: { name: admin_name }, text: `${user.name} joined.`, color: '#c2f0c2' })
            console.log(`joined ${user.name} to room ${user.room_id}`)
        }

        /**
         * Initialize a game in the room of the user, will setup the room with the configuration selected.
         */
        const start = () => {            
            const user = cache.users.findOne(socket.id)
            if(!user) return
            const room = cache.rooms.get(user.room_id)

            if(user && room) {
                cache.users.findByRoom(user.room_id).map(user => {
                    user.points = 0
                })
                room.line_history = []
                room.words = room.all_words
                room.is_start = true
                room.round = 1
                room.time = room.max_time
                cache.setRandomWord(room)
                io.to(room._id).emit('clear_draw')
                io.to(user.room_id).emit('room_data', { action: 'start', user, room, users: cache.users.findByRoom(user.room_id) })
                gameLoop(room)
            }
        }

        /**
         * Chage the drawer of the room.
         * 
         * @param {Object} room 
         */
        const next_player = (room) => {
            cache.setNextHost(room)
            if(room.is_start) {
                room.line_history = []
                room.round++
                room.time = room.max_time
                cache.setRandomWord(room)
                
                io.to(room._id).emit('clear_draw')
                return io.to(room._id).emit('room_data', { action: 'next_player', room, users: cache.users.findByRoom(room._id) })
            }
        }

        /**
         * Ends the game of the room and look for the winner.
         * 
         * @param {*} room 
         */
        const end_game = (room) => {
            room.is_start = false
            room.round++
            const winner = cache.users.findByRoom(room._id).sort((a,b)=>b.points - a.points)[0]
            return io.to(room._id).emit('room_data', { action: 'game_ends', room, users: cache.users.findByRoom(room._id), winner })
        }

        /**
         * Create a promise in order to work as a separate thread, setup a 1 sec interval
         * and update room time, resolve when game is over.
         * 
         * @param {Object} room 
         */
        const gameLoop = (room) => {
            return new Promise((resolve, reject) => { 
                const loop = setInterval(()=> {
                    if(room.time > 0) {
                        room.time--
                        io.to(room._id).emit('room_data', { action: 'update_time', room, users: cache.users.findByRoom(room._id) })
                    } else {
                        if(room.words.length == 0 || room.max_rounds - 1 == room.round) {
                            end_game(room)
                            clearInterval(loop)
                            resolve(true)
                        } else {
                            next_player(room)
                        }
                    }
                }, 1000)
            })
        }
    })
}