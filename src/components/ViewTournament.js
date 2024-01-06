import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { Box, Button, Typography, Card, CardActionArea, CardContent, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Grid, Modal, Stack, TextField, Tooltip, Zoom } from '@mui/material'
import AddIcon from '@mui/icons-material/Add';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import LinkIcon from '@mui/icons-material/Link';
import { db } from '../config/firebase';
import { UserAuth } from '../config/authContext';
import { getDoc, getDocs, updateDoc, doc, collection, query, where, orderBy } from 'firebase/firestore';

export default function ViewTournament() {
    const tournamentID = new URLSearchParams(window.location.search).get("id")
    const { user } = UserAuth()
    const navigate = useNavigate()

    const [viewerType, setViewerType] = useState('spectator')

    const [openViewModal, setOpenViewModal] = useState(false)
    const [openAddUserModal, setOpenAddUserModal] = useState(false)
    const [openConfirmation, setOpenConfirmation] = useState(false)
    const [openSuspendConfirmation, setOpenSuspendConfirmation] = useState(false)

    const [tournamentDetails, setTournamentDetails] = useState({})
    const [participantList, setParticipantList] = useState([])
    const [collaboratorList, setCollaboratorList] = useState([])
    const [accountDetails, setAccountDetails] = useState({})
    const [userTeamDetails, setUserTeamDetails] = useState({})

    const [searchMode, setSearchMode] = useState(false)
    const [searchCriteria, setSearchCriteria] = useState('')
    const [searchResultList, setSearchResultList] = useState([])

    
    useEffect(() => {
        const getTournament = async () => {
            try {
                const res = await getDoc(doc(db, 'tournaments', tournamentID))
                const resList = { ...res.data(), id: res.id }

                setTournamentDetails(processDate(resList))
                getParticipants(resList)
                getCollaborators(resList)
                user.uid === resList.host && setViewerType('host')
            } catch (err) {
                console.error(err)
            }
        }
        const getParticipants = async (tDetails) => {
            if (tDetails.type === 'individual') {
                try {
                    const q = query(collection(db, 'accounts'), orderBy('username'))
                    const data = await getDocs(q)
                    const resList = data.docs.map((doc) => ({...doc.data(), id: doc.id})).filter((item) => tDetails.participants.includes(item.id))
                    
                    setParticipantList(resList)
                    user.uid == (resList.find((item) => item.id === user.uid))?.id && setViewerType('participant')
                } catch (err) {
                    console.error(err)
                }
            } else if (tDetails.type === 'team') {
                try {
                    const q = query(collection(db, 'teams'), orderBy('handle'))
                    const data = await getDocs(q)
                    const resList = data.docs.map((doc) => ({...doc.data(), id: doc.id})).filter((item) => tDetails.participants.includes(item.id))
                    
                    setParticipantList(resList)
                    resList.find((item) => item.members.includes(user.uid)) && setViewerType('participant')
                } catch (err) {
                    console.error(err)
                }
            }
        }
        const getCollaborators = async (tDetails) => {
            try {
                const q = query(collection(db, 'accounts'), orderBy('username'))
                const data = await getDocs(q)
                const resList = data.docs.map((doc) => ({...doc.data(), id: doc.id})).filter((item) => tDetails.collaborators.includes(item.id))

                setCollaboratorList(resList)
                user.uid == (resList.find((item) => item.id === user.uid))?.id && setViewerType('collaborator')
            } catch (err) {
                console.error(err)
            }
        }
        const getUserTeam = async () => {
            try {
                const q = query(collection(db, 'teams'), where('members', 'array-contains', user.uid))
                const data = await getDocs(q)
                const resList = data.docs.map((doc) => ({...doc.data(), id: doc.id}))

                setUserTeamDetails(resList[0])
            } catch (err) {
                console.error(err)
            }
        }
        getTournament()
        getUserTeam()
    }, [])

    const processDate = (tournament) => {
        const startDateList = tournament.date.start.toDate().toDateString().split(' ').slice(1)
        const endDateList = tournament.date.end.toDate().toDateString().split(' ').slice(1)

        return {
            ...tournament,
            stringDate: {
              start: startDateList,
              end: endDateList,
            },
        }
    }

    const viewMatch = (id) => {
        window.location.href = `/ViewMatch?id=${id}`;
    }

    const viewAccount = async (id) => {
        try {
          const accountDocRef = doc(db, 'accounts', id)
          const accountDocSnap = await getDoc(accountDocRef)
      
          if (accountDocSnap.exists()) {
            const accountData = { ...accountDocSnap.data(), id: accountDocSnap.id }
            setAccountDetails(accountData)
            setOpenViewModal(true)
          } else {
            const teamDocRef = doc(db, 'teams', id)
            const teamDocSnap = await getDoc(teamDocRef)
      
            if (teamDocSnap.exists()) {
              const teamData = { ...teamDocSnap.data(), id: teamDocSnap.id }
              setAccountDetails(teamData)
              setOpenViewModal(true)
            }
          }
        } catch (err) {
          console.error(err)
        }
    }

    const openSearch = (mode) => {
        setSearchMode(mode)
        setSearchCriteria('')
        setSearchResultList([])
        setOpenAddUserModal(true)
    }

    const searchUser = async (e) => {
        e.preventDefault()
        if (searchCriteria === '') { // If search criteria is empty, return empty results instead of everything
            setSearchResultList([])
        } else {
            if (searchMode === 'participants') {
                if (tournamentDetails.type === 'individual') {
                    try {
                        const q = query(collection(db, 'accounts'), orderBy('username'))
                        const data = await getDocs(q)
                        const resList = data.docs.map((doc) => ({ ...doc.data(), id: doc.id })).filter((item) => !tournamentDetails.participants.includes(item.id) && !tournamentDetails.collaborators.includes(item.id) && item.id !== tournamentDetails.host && (item.username?.toLowerCase().includes(searchCriteria.toLowerCase()) || item.fullName?.toLowerCase().includes(searchCriteria.toLowerCase())))
    
                        setSearchResultList(resList)
                    } catch (err) {
                        console.error(err);
                    }                  
                } else if (tournamentDetails.type === 'team') {
                    try {
                        const q = query(collection(db, 'teams'), orderBy('handle'))
                        const data = await getDocs(q)
                        const resList = data.docs.map((doc) => ({ ...doc.data(), id: doc.id })).filter((item) => !tournamentDetails.participants.includes(item.id) && item.id !== userTeamDetails.id && (item.handle?.toLowerCase().includes(searchCriteria.toLowerCase()) || item.name?.toLowerCase().includes(searchCriteria.toLowerCase())))

                        setSearchResultList(resList)
                    } catch (err) {
                        console.error(err);
                    }
                }
            } else if (searchMode === 'collaborators') {
                try {
                    const q = query(collection(db, 'accounts'), orderBy('username'))
                    const data = await getDocs(q)
                    const resList = data.docs.map((doc) => ({ ...doc.data(), id: doc.id })).filter((item) => !tournamentDetails.collaborators.includes(item.id) && !tournamentDetails.participants.includes(item.id) && (item.username?.toLowerCase().includes(searchCriteria.toLowerCase()) || item.fullName?.toLowerCase().includes(searchCriteria.toLowerCase())))
    
                    setSearchResultList(resList)
                } catch (err) {
                    console.error(err);
                }
            }
        }
    }

    const addUser = async (id) => {
        if (searchMode === 'participants') {
            if (tournamentDetails.participants?.length < tournamentDetails.maxParticipants) {
                const res = await getDoc(doc(db, 'matches', tournamentID))
                const resList = res.data()
                const matchStatistics = resList.statistics

                let addedParticipantStatistics = matchStatistics
                addedParticipantStatistics[id] = {
                    wins: 0,
                    losses: 0,
                    points: 0,
                }

                try {
                    await updateDoc(doc(db, 'tournaments', tournamentID), {
                        participants: [...tournamentDetails.participants, id]
                    })
                    await updateDoc(doc(db, 'matches', tournamentID), {
                        participants: [...tournamentDetails.participants, id],
                        statistics: addedParticipantStatistics
                    })
                    alert('Participant added successfully')
                    window.location.reload()
                } catch (err) {
                    console.error(err)
                }
            }
        } else if (searchMode === 'collaborators') {
            try {
                await updateDoc(doc(db, 'tournaments', tournamentID), {
                    collaborators: [...tournamentDetails.collaborators, id]
                })
                alert('Collaborator added successfully')
                window.location.reload()
            } catch (err) {
                console.error(err)
            }
        }
    }

    const removeUser = async (id) => {
        if (tournamentDetails.participants?.includes(accountDetails.id)) {
            try {
                const res = await getDoc(doc(db, 'matches', tournamentID)) // To remove the participant from statistics
                const resList = res.data()
                const removedParticipant = resList.statistics
                delete resList.statistics[id]

                await updateDoc(doc(db, 'tournaments', tournamentID), { // To remove the participant from tournament
                    participants: tournamentDetails.participants.filter(participant => participant !== id)
                })

                const newMatchList = { ...resList }
                Object.entries(resList.round).map(([keyRound, valueRound]) => { // To remove the participant from scoreboard
                    Object.entries(valueRound.match).map(([keyMatch, valueMatch]) => {
                        if (valueMatch.some(dict => dict.hasOwnProperty(accountDetails.id))) { // If the participant is in the match

                            newMatchList.round[keyRound].match[keyMatch][2].victor = ''

                            if (newMatchList.round[keyRound].match[keyMatch][0].hasOwnProperty(accountDetails.id)) {
                                newMatchList.round[keyRound].match[keyMatch][0] = {}
                            } else if (newMatchList.round[keyRound].match[keyMatch][1].hasOwnProperty(accountDetails.id)) {
                                newMatchList.round[keyRound].match[keyMatch][1] = {}
                            }
                        }
                    })
                })

                await updateDoc(doc(db, 'matches', tournamentID), {
                    participants: tournamentDetails.participants.filter(participant => participant !== id),
                    round: newMatchList.round,
                    statistics: removedParticipant
                })
                alert('Participant removed successfully')
                window.location.reload()
            } catch (err) {
                console.error(err)
            }
        } else if (tournamentDetails.collaborators?.includes(accountDetails.id)) {
            try {
                await updateDoc(doc(db, 'tournaments', tournamentID), {
                    collaborators: tournamentDetails.collaborators.filter(collaborator => collaborator !== id)
                })
                alert('Collaborator removed successfully')
                window.location.reload()
            } catch (err) {
                console.error(err)
            }
        }
    }

    const editTournament = (param) =>{
        navigate('/EditTournament', {state:{id:param}}) // Handle navigation while passing ID as hidden parameter
    }

    const suspendTournament = async () => {
        try {
            await updateDoc(doc(db, 'tournaments', tournamentID), {
                status: 0
            })
            alert('Tournament suspended successfully')
            window.location.reload()
        } catch (err) {
            console.error(err)
        }
    }

    const copyToClipboard = () => {
        const currentUrl = window.location.href
    
        const textarea = document.createElement('textarea')
        textarea.value = currentUrl
        document.body.appendChild(textarea)
    
        textarea.select()
        textarea.setSelectionRange(0, 99999) // For mobile devices
    
        document.execCommand('copy')
        document.body.removeChild(textarea)
    
        alert('URL copied to clipboard!')
    }

    const registerTournament = async () => {
        if (tournamentDetails.participants?.length < tournamentDetails.maxParticipants) {
            if (tournamentDetails.type === 'individual') {
                try {
                    await updateDoc(doc(db, 'tournaments', tournamentID), {
                        participants: [...tournamentDetails.participants, user.uid]
                    })
                    await updateDoc(doc(db, 'matches', tournamentID), {
                        participants: [...tournamentDetails.participants, user.uid],
                        statistics: {
                            [user.uid]: {
                                wins: 0,
                                losses: 0,
                                points: 0,
                            }
                        }
                    })
                    alert('You have successfully registered')
                    window.location.reload()
                } catch (err) {
                    console.error(err)
                }
            } else if (tournamentDetails.type === 'team') {
                try {
                    const data = await getDocs(collection(db, 'teams'))
                    const resList = data.docs.map((doc) => ({ ...doc.data(), id: doc.id })).filter((item) => item.leader === user.uid)
    
                    await updateDoc(doc(db, 'tournaments', tournamentID), {
                        participants: [...tournamentDetails.participants, resList[0].id]
                    })
                    await updateDoc(doc(db, 'matches', tournamentID), {
                        participants: [...tournamentDetails.participants, resList[0].id],
                        statistics: {
                            [resList[0].id]: {
                                wins: 0,
                                losses: 0,
                                points: 0,
                            }
                        }
                    })

                    alert('Your team has been successfully registered')
                    window.location.reload()
                } catch (err) {
                    console.error(err)
                }
            }
        }
    }


    return (
        <>
        <Box height='100%' width='100%' padding='185px 0 150px' display='flex' justifyContent='center'>
            <Stack width='65%' gap='20px'>
                <img src={tournamentDetails.imgURL}/>
                <Box display='flex' justifyContent='space-between' alignItems='center'>
                    <Stack gap='50px' width='100%'>
                        <Stack gap='5px'>
                            <Typography variant='h2'>
                                {tournamentDetails.status === 0 ? <span style={{ color: '#888' }}>SUSPENDED: </span>
                                    : tournamentDetails.date?.end.toDate() < Date.now() ? (
                                        <span style={{ color: '#888' }}>ENDED: </span>
                                    ) : tournamentDetails.date?.start.toDate() <= Date.now() && tournamentDetails.date?.end.toDate() >= Date.now() ? (
                                        <span style={{ color: '#CB3E3E' }}>LIVE NOW: </span>
                                    ) : null
                                }
                                {tournamentDetails.title}
                            </Typography>
                            {(viewerType === 'host' || viewerType === 'collaborator') && 
                                <Box display='flex' width='100%' justifyContent='flex-end'>
                                    <Button variant='blue' sx={{height:'30px'}} startIcon={<LinkIcon />} onClick={() => copyToClipboard()}>Invitation Link</Button>
                                </Box>
                            }
                        </Stack>

                        
                        <Box display='flex' justifyContent='space-between'>
                            <Box width='325px' display='flex' alignItems='center' gap='20px'>
                                <img width='60px' src={require('../img/icons/trophy.png')} />
                                <Stack>
                                    <Typography color='#CB3E3E' variant='subtitle1'>Grand Prize</Typography>
                                    <Typography textTransform='capitalize' variant='subtitle1'>{tournamentDetails.prizes?.first ? tournamentDetails.prizes?.first : 'No prize'}</Typography>
                                </Stack>
                            </Box>
                            <Box width='325px' display='flex' alignItems='center' gap='20px'>
                                <img width='60px' src={require('../img/icons/calendar.png')} />
                                <Stack>
                                    <Typography color='#CB3E3E' variant='subtitle1'>Tournament Date</Typography>
                                    <Typography textTransform='uppercase' variant='subtitle1'>
                                        {tournamentDetails.date?.start.toDate().toDateString() === tournamentDetails.date?.end.toDate().toDateString() ? (
                                            `${tournamentDetails.stringDate?.start[0]} ${tournamentDetails.stringDate?.start[1]}, ${tournamentDetails.stringDate?.start[2]}`
                                        ) : (
                                            tournamentDetails.stringDate?.start[2] === tournamentDetails.stringDate?.end[2] ? (
                                                tournamentDetails.stringDate.start[0] === tournamentDetails.stringDate.end[0] ? (
                                                    `${tournamentDetails.stringDate.start[0]} ${tournamentDetails.stringDate.start[1]} — ${tournamentDetails.stringDate.end[1]}, ${tournamentDetails.stringDate.end[2]}`
                                                ): (
                                                    `${tournamentDetails.stringDate.start[0]} ${tournamentDetails.stringDate.start[1]} — ${tournamentDetails.stringDate.end[0]} ${tournamentDetails.stringDate.end[1]}, ${tournamentDetails.stringDate.end[2]}`
                                                )
                                            ) : (
                                                `${tournamentDetails.stringDate?.start[0]} ${tournamentDetails.stringDate?.start[1]}, ${tournamentDetails.stringDate?.start[2]} — ${tournamentDetails.stringDate?.end[0]} ${tournamentDetails.stringDate?.end[1]}, ${tournamentDetails.stringDate?.end[2]}`
                                            )
                                        )}
                                    </Typography>
                                </Stack>
                            </Box>
                            <Box width='325px' display='flex' alignItems='center' gap='20px'>
                                <img width='60px' src={require('../img/icons/location.png')} />
                                <Stack>
                                    <Typography color='#CB3E3E' variant='subtitle1'>Venue</Typography>
                                    <Typography variant='subtitle1'>{tournamentDetails.venue}</Typography>
                                </Stack>
                            </Box>
                        </Box>

                        <Typography variant='body1'>{tournamentDetails.description}</Typography>

                        <Box display='flex' justifyContent='space-between'>
                            <Stack width='50%' gap='30px'>
                                <Typography textTransform='uppercase' variant='h5'>Tournament Summary</Typography>
                                <table>
                                    <tbody>
                                        <tr>
                                            <td width='85px'>
                                                <Typography variant='subtitle2'>Sport:</Typography>
                                            </td>
                                            <td>
                                                <Typography textTransform='uppercase' variant='subtitle3'>{tournamentDetails.sport}</Typography>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>
                                                <Typography variant='subtitle2'>Type:</Typography>
                                            </td>
                                            <td>
                                                <Typography textTransform='uppercase' variant='subtitle3'>{tournamentDetails.type}</Typography>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>
                                                <Typography variant='subtitle2'>Gender:</Typography>
                                            </td>
                                            <td>
                                                <Typography textTransform='uppercase' variant='subtitle3'>{tournamentDetails.gender}</Typography>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>
                                                <Typography variant='subtitle2'>Format:</Typography>
                                            </td>
                                            <td>
                                                <Typography textTransform='uppercase' variant='subtitle3'>{tournamentDetails.format}</Typography>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </Stack>
                            <Stack width='50%' gap='30px'>
                                <Typography textTransform='uppercase' variant='h5'>Prizes</Typography>
                                <table>
                                    <tbody>
                                        <tr>
                                            <td width='50px'>
                                                <Typography color='#D0AF00' variant='subtitle2'>1ST</Typography>
                                            </td>
                                            <td>
                                                <Typography textTransform='uppercase' variant='subtitle3'>{tournamentDetails.prizes?.first === '' ? 'No prize' : tournamentDetails.prizes?.first}</Typography>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>
                                                <Typography color='#888' variant='subtitle2'>2ND</Typography>
                                            </td>
                                            <td>
                                                <Typography textTransform='uppercase' variant='subtitle3'>{tournamentDetails.prizes?.second === '' ? 'No prize' : tournamentDetails.prizes?.second}</Typography>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>
                                                <Typography color='#AA6600' variant='subtitle2'>3RD</Typography>
                                            </td>
                                            <td>
                                                <Typography textTransform='uppercase' variant='subtitle3'>{tournamentDetails.prizes?.third === '' ? 'No prize' : tournamentDetails.prizes?.third}</Typography>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </Stack>
                            {(viewerType === 'host' || viewerType === 'collaborator') &&
                                <Box display='flex' gap='25px'>
                                    <Stack bgcolor='#E4E4E4' width='200px' height='160px' borderRadius='15px' padding='15px' gap='10px'>
                                        <Box display='flex' justifyContent='space-between' alignItems='center'>
                                            <Stack>
                                                <Typography variant='h5' textTransform='uppercase'>Participants</Typography>
                                                <Typography variant='body2'>{tournamentDetails.participants?.length}/{tournamentDetails.maxParticipants}</Typography>
                                            </Stack>
                                            {tournamentDetails.participants?.length < tournamentDetails.maxParticipants && <Button variant='green' sx={{padding:'0', width:'35px', minWidth:'40px', height:'35px'}} onClick={() => openSearch('participants')}><AddIcon sx={{fontSize:'30px'}}/></Button>}
                                        </Box>
                                        <Box bgcolor='white' borderRadius='7.5px' height='100%' overflow='hidden'>
                                            <Stack height='100%' sx={{overflowY:'auto'}}>
                                                {participantList.map((participant) => 
                                                    <Box onClick={() => {viewAccount(participant.id)}} key={participant.id} display='flex' justifyContent='space-between' alignItems='center' padding='5px 10px' borderBottom='1px solid #E4E4E4' sx={{cursor:'pointer'}}>
                                                        <Stack overflow='hidden'>
                                                            <Typography variant='subtitle3' fontWeight='bold' sx={{whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>@{tournamentDetails.type === 'team' ? participant.handle : participant.username}</Typography>
                                                            <Typography variant='body2' sx={{textTransform: tournamentDetails.type !== 'team' ? 'capitalize' : 'none', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{tournamentDetails.type === 'team' ? participant.name : participant.fullName}</Typography>
                                                        </Stack>
                                                        <ArrowForwardIosIcon sx={{fontSize:'20px'}}/>
                                                    </Box>
                                                )}
                                            </Stack>
                                        </Box>
                                    </Stack>
                                    {viewerType !== 'collaborator' && 
                                        <Stack bgcolor='#E4E4E4' width='200px' height='160px' borderRadius='15px' padding='15px' gap='10px'>
                                            <Box display='flex' justifyContent='space-between' alignItems='center'>
                                                <Typography variant='h5' textTransform='uppercase'>Collaborators</Typography>
                                                {viewerType === 'host' && <Button variant='green' sx={{padding:'0', width:'35px', minWidth:'40px', height:'35px'}} onClick={() => openSearch('collaborators')}><AddIcon sx={{fontSize:'30px'}}/></Button>}
                                            </Box>
                                            <Box bgcolor='white' borderRadius='7.5px' height='100%' overflow='hidden'>
                                                <Stack height='100%' sx={{overflowY:'auto'}}>
                                                    {collaboratorList.map((collaborator) => 
                                                        <Box onClick={() => {viewAccount(collaborator.id)}} key={collaborator.id} display='flex' justifyContent='space-between' alignItems='center' padding='5px 10px' borderBottom='1px solid #E4E4E4' sx={{cursor:'pointer'}}>
                                                            <Stack>
                                                                <Typography variant='subtitle3' fontWeight='bold' sx={{whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>@{collaborator.username}</Typography>
                                                                <Typography variant='body2' textTransform='capitalize' sx={{whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{collaborator.fullName}</Typography>
                                                            </Stack>
                                                            <ArrowForwardIosIcon sx={{fontSize:'20px'}}/>
                                                        </Box>
                                                    )}
                                                </Stack>
                                            </Box>
                                        </Stack>
                                    }
                                </Box> 
                            }
                        </Box>
                        
                        <Box display='flex' justifyContent='center' marginTop='25px' gap='30px'>
                            {(viewerType === 'host' || viewerType === 'collaborator') && 
                                <>
                                {viewerType === 'host' && <Button variant='blue' sx={{width:'300px'}} onClick={() => editTournament(tournamentDetails.id)}>Edit Tournament</Button>}
                                <Button variant='blue' sx={{width:'300px'}} onClick={() => viewMatch(tournamentID)}>Manage Score & Matchup</Button>
                                {viewerType === 'host' && (!(tournamentDetails.date?.end.toDate() < Date.now()) && tournamentDetails.status === 1) && <Button variant='red' sx={{width:'250px'}} onClick={() => setOpenSuspendConfirmation(true)}>Suspend Tournament</Button>}
                                </>
                            }

                            {viewerType === 'spectator' && 
                                (tournamentDetails.date?.end.toDate() < Date.now() ? ( // If tournament has ended
                                    <Button sx={{width:'300px'}} variant="red" onClick={() => viewMatch(tournamentID)}>View Results</Button>
                                    ) : tournamentDetails.date?.start.toDate() <= Date.now() && tournamentDetails.date?.end.toDate() >= Date.now() ? ( // If tournament is live
                                    <Button sx={{width:'300px'}} variant="red" onClick={() => viewMatch(tournamentID)}>View Match</Button>
                                    ) : !user ? ( // If user is not logged in
                                        <Button variant="red" disabled>Login to register for this tournament</Button>
                                    ) : user && !user.email.includes('@matchpoint.com') ? ( // If user is logged in but not admin
                                        tournamentDetails.type === 'team' && (userTeamDetails.leader !== user.uid || userTeamDetails.members.includes(tournamentDetails.host) || userTeamDetails.members?.some(member => tournamentDetails.collaborators.includes(member))) ?
                                            <Tooltip TransitionComponent={Zoom} title={userTeamDetails.leader !== user.uid ? 'Only your team leader can register on behalf of the team' : "You can't register for a tournament hosted/collaborated by your team member"} arrow>
                                                <span><Button variant="red" disabled>Register for this tournament</Button></span>
                                            </Tooltip>
                                            :
                                            tournamentDetails.participants?.length !== parseInt(tournamentDetails.maxParticipants) ? 
                                                <Button variant="red" onClick={() => registerTournament()}>Register for this tournament</Button>
                                                :
                                                <Button variant="red" disabled>Tournament fully registered</Button>
                                    ) : <></>
                                )
                            }


                            {viewerType === 'participant' &&
                                <Button sx={{width:'300px'}} variant="red" onClick={() => {viewMatch(tournamentID)}}>{tournamentDetails.date?.end.toDate() < Date.now() ? 'View Results' : 'Matchup & Schedule'}</Button>
                            }
                        </Box>
                    </Stack>
                </Box>
            </Stack>
        </Box>

        <Modal open={openAddUserModal} onClose={() => {setOpenAddUserModal(false)}} disableScrollLock>
            <Box className='ModalView' display='flex' borderRadius='20px' width='400px' padding='30px' margin='120px auto' bgcolor='#EEE' justifyContent='center' alignItems='center'>
                <Stack width='100%' gap='40px'>
                    <Stack gap='30px'>
                        <form style={{display:'flex', width:'100%'}} onSubmit={searchUser}>
                            <TextField className='searchTextField' value={searchCriteria} placeholder={searchMode === 'participants' ? 'SEARCH PLAYER/TEAM' : 'SEARCH USER'} onChange={(e) => setSearchCriteria(e.target.value)} sx={{width:'100% !important'}}/>
                            <Button variant='search' type='submit'><SearchRoundedIcon sx={{fontSize:'30px'}}/></Button>
                        </form>
                        <Grid container gap='10px' alignItems='stretch' maxHeight='175px' sx={{overflowY:'auto'}}>
                            {searchResultList.map((res) => (
                                searchMode === 'participants' ?
                                    <Grid key={res.id} item width='100%' borderRadius='15px'>
                                        <Card sx={{bgcolor:'white', textAlign:'center', height:'75px', borderRadius:'15px'}} >
                                            <CardActionArea sx={{height:'75px'}} onClick={() => viewAccount(res.id)}>
                                                <CardContent sx={{margin:'0 20px', overflow:'hidden'}}>
                                                    {tournamentDetails.type === 'individual' ?
                                                        <Box display='flex' justifyContent='space-between' alignItems='center'>
                                                            <Stack>
                                                                <Typography variant='h5'>@{res.username}</Typography>
                                                                <Typography textTransform='capitalize' variant='subtitle4' textAlign='left'>{res.fullName}</Typography>
                                                            </Stack>
                                                            <img src={require('../img/icons/individual.png')} width='30px'/>
                                                        </Box>
                                                        :
                                                        <Box display='flex' justifyContent='space-between' alignItems='center'>
                                                            <Stack>
                                                                <Typography variant='h5'>@{res.handle}</Typography>
                                                                <Typography textTransform='capitalize' variant='subtitle4' textAlign='left'>{res.name}</Typography>
                                                            </Stack>
                                                            <img src={require('../img/icons/team.png')} width='30px'/>
                                                        </Box>
                                                    }
                                                </CardContent>
                                            </CardActionArea>
                                        </Card>
                                    </Grid>
                                    :
                                    <Grid key={res.id} item width='100%' borderRadius='15px'>
                                        <Card sx={{bgcolor:'white', textAlign:'center', height:'75px', borderRadius:'15px'}} >
                                            <CardActionArea sx={{height:'75px'}} onClick={() => viewAccount(res.id)}>
                                                <CardContent sx={{margin:'0 20px', overflow:'hidden'}}>
                                                    <Typography variant='h5'>@{res.username}</Typography>
                                                    <Typography textTransform='capitalize' variant='subtitle4'>{res.fullName}</Typography>
                                                </CardContent>
                                            </CardActionArea>
                                        </Card>
                                    </Grid>
                            ))}
                        </Grid>
                    </Stack>
                </Stack>
            </Box>
        </Modal>

        <Modal open={openViewModal} onClose={() => {setOpenViewModal(false)}} disableScrollLock>
            <Box className='ModalView' display='flex' borderRadius='20px' width='400px' padding='30px' margin='120px auto' bgcolor='#EEE' justifyContent='center' alignItems='center'>
                <Stack width='100%' gap='40px'>
                    <Stack gap='15px'>
                        {tournamentDetails.participants?.includes(accountDetails.id) ? (
                            <Typography textTransform='uppercase' variant='h5'>Participant Details:</Typography>
                        ) : (
                            tournamentDetails.collaborators?.includes(accountDetails.id) ? (
                                <Typography textTransform='uppercase' variant='h5'>Collaborator Details:</Typography>
                            ) : (
                                <Typography textTransform='uppercase' variant='h5'>User Details:</Typography>
                            )
                        )}
                        <table>
                            <tbody>
                                <tr>
                                    <td width='120px'>
                                        <Typography variant='subtitle2'>{accountDetails.handle ? 'Handle' : 'Username'}:</Typography>
                                    </td>
                                    <td>
                                        <Typography variant='subtitle3'>{accountDetails.handle ? accountDetails.handle : accountDetails.username}</Typography>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <Typography variant='subtitle2'>{accountDetails.fullName ? 'Full Name' : 'Name'}:</Typography>
                                    </td>
                                    <td>
                                        <Typography textTransform='capitalize' variant='subtitle3'>{accountDetails.fullName ? accountDetails.fullName : accountDetails.name}</Typography>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <Typography variant='subtitle2'>Region:</Typography>
                                    </td>
                                    <td>
                                        <Typography textTransform='capitalize'variant='subtitle3'>{accountDetails.region}</Typography>
                                    </td>
                                </tr>
                                {tournamentDetails.type !== 'team' &&
                                    <tr>
                                        <td>
                                            <Typography variant='subtitle2'>Gender:</Typography>
                                        </td>
                                        <td>
                                            <Typography textTransform='capitalize' variant='subtitle3'>{accountDetails.gender}</Typography>
                                        </td>
                                    </tr>
                                }
                                <tr>
                                    <td>
                                        <Typography variant='subtitle2'>Sport(s):</Typography>
                                    </td>
                                    <td>
                                        <Typography textTransform='capitalize' variant='subtitle3'>{accountDetails.sports ? accountDetails.sports?.join(', ') : accountDetails.sportInterests?.join(', ')}</Typography>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </Stack>
                    {tournamentDetails.participants?.includes(accountDetails.id) ? (
                        <Button variant='red' onClick={() => setOpenConfirmation(true)}>Remove Participant</Button>
                    ) : (
                        tournamentDetails.collaborators?.includes(accountDetails.id) ? (
                            <Button variant='red' onClick={() => setOpenConfirmation(true)}>Remove Collaborator</Button>
                        ) : (
                            <Button variant='blue' onClick={() => addUser(accountDetails.id)}>Add {searchMode === 'participants' ? 'Participant' : 'Collaborator'}</Button>
                        )
                    )}
                </Stack>
            </Box>
        </Modal>

        <React.Fragment>
            <Dialog open={openConfirmation} onClose={() => setOpenConfirmation(false)}>
                <DialogTitle>
                    Remove {tournamentDetails.participants?.includes(accountDetails.id) ? 'Participant' : 'Collaborator'}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to remove this {tournamentDetails.participants?.includes(accountDetails.id) ? 'participant' : 'collaborator'}?
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{padding:'0 24px 16px'}}>
                    <Button onClick={() => removeUser(accountDetails.id)} variant='blue'>Yes</Button>
                    <Button onClick={() => setOpenConfirmation(false)} variant='red' autoFocus>No</Button>
                </DialogActions>
            </Dialog>
        </React.Fragment>

        <React.Fragment>
            <Dialog open={openSuspendConfirmation} onClose={() => setOpenSuspendConfirmation(false)}>
                <DialogTitle>
                    PERMANENTLY Suspend Tournament
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to permanently suspend this tournament? You will NOT be able to undo this action.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{padding:'0 24px 16px'}}>
                    <Button onClick={() => suspendTournament()} variant='blue'>Yes</Button>
                    <Button onClick={() => setOpenSuspendConfirmation(false)} variant='red' autoFocus>No</Button>
                </DialogActions>
            </Dialog>
        </React.Fragment>
        </>
  )
}
