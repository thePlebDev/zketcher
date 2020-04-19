import React, { useState } from 'react'
import {
    withRouter
  } from 'react-router-dom'

const words = [ 
    {
        id: 'lol',
        image: 'https://www.multifreakshop.com/wp-content/uploads/2018/02/unnamed.jpg'
    },
    {
        id: 'ow',
        image: 'https://i.ya-webdesign.com/images/widowmaker-logo-png-7.png'
    },
    // {
    //     id: 'ds',
    //     image: ''
    // },
    // {
    //     id: 'ow',
    //     image: ''
    // }
]

const CreateRoom = ({ history, socket }) => {
    const [name, setName] = useState('')
    const [id, setId] = useState('')
    const [maxTime, setMaxTime] = useState(120)
    const [maxRounds, setMaxRounds] = useState(8)
    const [wordsId, setWordsId] = useState('lol')

    const create = e => {
        e.preventDefault()
        if(id && name && maxRounds && maxTime) {
            sessionStorage.setItem('username', name)
            const opts = {
                _id: id,
                max_time: maxTime,
                max_rounds: maxRounds,
                words_id: wordsId
            }
            sessionStorage.setItem('opts', JSON.stringify(opts))
            history.push(`/play/${id}`)
        }
        
    }

    const handleWordsClick = (e, word) => {
        setWordsId(word.id)
    }
    return (
        <>
            <form onSubmit={create}>
                <div>
                    <div className="form-group">
                        <div className="input-group">
                            <div className="input-group-prepend">
                                <div className="input-group-text">
                                    <i className="material-icons prefix">account_circle</i>
                                </div>
                            </div>
                            <input name="name" type="text" placeholder="Username" value={name}
                                className="form-control" required onChange={event => setName(event.target.value)}/>
                        </div>
                    </div>
                    <div className="form-group">
                        <div className="input-group">
                            <div className="input-group-prepend">
                                <div className="input-group-text">
                                    <i className="material-icons prefix">home</i>
                                </div>
                            </div>
                            <input  name="id" type="text" placeholder="Room"
                                className="form-control" required onChange={event => setId(event.target.value)}/>
                        </div>
                    </div>

                    <div className="form-group">
                        <div className="input-group">
                            <div className="input-group-prepend">
                                <div className="input-group-text">
                                    <i className="material-icons prefix">home</i>
                                </div>
                            </div>
                            <input  name="room" type="number" placeholder="Max rounds" value={maxRounds} max="20"
                                className="form-control" required onChange={event => setMaxRounds(event.target.value)}/>
                        </div>
                    </div>

                    <div className="form-group">
                        <div className="input-group">
                            <div className="input-group-prepend">
                                <div className="input-group-text">
                                    <i className="material-icons prefix">alarm</i>
                                </div>
                            </div>
                            <input  name="room" type="number" placeholder="Time per round (seconds)" value={maxTime} max="600"
                                className="form-control" required onChange={event => setMaxTime(event.target.value)}/>
                        </div>
                    </div>

                    <div className="form-group">
                        <div className="input-group">
                            <div className="input-group-prepend">
                                <div className="input-group-text">
                                    <i className="material-icons prefix">home</i>
                                </div>
                            </div>
                            <input  name="room" type="number" placeholder="Time per round (seconds)" value={maxTime} max="600"
                                className="form-control" required onChange={event => setMaxTime(event.target.value)}/>
                        </div>
                    </div>

                    <div className="form-group word-selection">
                        <ul>
                            { words.map((word, key) => { return (
                                <li key={key}>
                                    <input type="checkbox" id={`cb${key}`} checked={wordsId == word.id} onClick={e => handleWordsClick(e, word)} readOnly/>
                                    <label htmlFor={`cb${key}`}><img src={word.image} /></label>
                                </li>
                            )})}
                        </ul>
                    </div>
                </div>
                <button type="submit" className="btn btn-outline-main btn-block">
                    Create
                </button>
            </form>
        </>
    )
}

export default withRouter(CreateRoom)