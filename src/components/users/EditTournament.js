import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Box, Button, FormControl, Grid, InputLabel, MenuItem, Modal, Select, Stack, TextField, Typography } from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { db } from '../../config/firebase';
import { UserAuth } from '../../config/authContext';
import { getDoc, getDocs, doc, updateDoc, collection, query, orderBy } from 'firebase/firestore';
import { ref, getStorage, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function EditTournament() {
    const location = useLocation()
    const { user } = UserAuth()

    const [openSaveFormatModal, setOpenSaveFormatModal] = useState(false)
    const [newCustomFormatName, setNewCustomFormatName] = useState('')
    const [openCustomFormatModal, setOpenCustomFormatModal] = useState(false)
    const [openViewModal, setOpenViewModal] = useState(false)

    const [originalNoRounds, setOriginalNoRounds] = useState('')
    const [originalMatchesPerRound, setOriginalMatchesPerRound] = useState([])

    const [customFormatList, setCustomFormatList] = useState([])
    const [customFormatDetails, setCustomFormatDetails] = useState([])
    const [noRounds, setNoRounds] = useState('')
    const [matchesPerRound, setMatchesPerRound] = useState([])

    const [searchCriteria, setSearchCriteria] = useState('')
    const [errorMessage, setErrorMessage] = useState('')

    const [originalDetails, setOriginalDetails] = useState({})
    const [format, setFormat] = useState('')
    const [sport, setSport] = useState('')
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [bannerImg, setBannerImg] = useState('')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [venue, setVenue] = useState('')
    const [region, setRegion] = useState('')
    const [type, setType] = useState('')
    const [gender, setGender] = useState('')
    const [maxParticipants, setMaxParticipants] = useState('')
    const [firstPrize, setFirstPrize] = useState('')
    const [secondPrize, setSecondPrize] = useState('')
    const [thirdPrize, setThirdPrize] = useState('')

    const genders = ["mens", "womens", "mixed"]
    const regions = ["North", "Central", "East", "West", "North-East"]
    const types = ["individual", "team"]
    const [sportList, setSportList] = useState([])
    

    useEffect(() => {
        const getSports = async () => {
            try {
                const q = query(collection(db, 'sports'), orderBy('name'))
                const data = await getDocs(q)
                const resList = data.docs.map((doc) => ({...doc.data(), id: doc.id}))
                setSportList(resList)
            } catch (err) {
                console.error(err)
            }
        }
        const getTournament = async () => {
            try {
                const res = await getDoc(doc(db, 'tournaments', location.state.id))
                const resList = res.data()

                setOriginalDetails(resList)
                setFormat(resList.format)
                setSport(resList.sport)
                setTitle(resList.title)
                setDescription(resList.description)
                setStartDate(resList.date.start.toDate().toISOString().split('T')[0])
                setEndDate(resList.date.end.toDate().toISOString().split('T')[0])
                setVenue(resList.venue)
                setRegion(resList.region)
                setType(resList.type)
                setGender(resList.gender)
                setMaxParticipants(resList.maxParticipants)
                setFirstPrize(resList.prizes.first)
                setSecondPrize(resList.prizes.second)
                setThirdPrize(resList.prizes.third)

                try {
                    const res = await getDoc(doc(db, 'matches', location.state.id))
                    const resList = res.data()
                    let matchesPerRound = []

                    setOriginalNoRounds(Object.keys(resList.round).length)
                    setNoRounds(Object.keys(resList.round).length)

                    for (let i = 0; i < Object.keys(resList.round).length; i++) {
                        matchesPerRound.push(Object.keys(resList.round[parseInt(i+1)].match).length)
                    }
                    setOriginalMatchesPerRound(matchesPerRound)
                    setMatchesPerRound(matchesPerRound)

                } catch (err) {
                    console.error(err)
                }

            } catch (err) {
                window.location.href = '/'
            }
        }
        getTournament()
        getSports()
        getCustomFormats()
    }, [])

    useEffect(() => {
        if (parseInt(maxParticipants) === 1 || parseInt(maxParticipants) === 0) {
            setNoRounds(0)
            setMatchesPerRound([])
            return
        } else if (parseInt(maxParticipants) === 2) {
            setNoRounds(1)
            setMatchesPerRound([1])
            return
        } else if (parseInt(maxParticipants) === 3) {
            setNoRounds(2)
            setMatchesPerRound([2, 1])
            return
        }

        if (format === 'single-elimination') {
            if ((maxParticipants & (maxParticipants - 1)) === 0 && maxParticipants !== 0) {
                const noRoundsGenerated = Math.ceil(Math.log2(maxParticipants))
                setNoRounds(noRoundsGenerated)

                let matchesPerRoundGenerated = []
                for (let i = 0; i < noRoundsGenerated; i++) {
                    matchesPerRoundGenerated.push((maxParticipants / Math.pow(2, i)) / 2)
                }
                setMatchesPerRound(matchesPerRoundGenerated)

            } else {
                const nextPowerOfTwo = maxParticipants <= 0 ? 1 : 2 ** Math.ceil(Math.log2(maxParticipants))
                let firstRound = (maxParticipants - (nextPowerOfTwo - maxParticipants)) / 2
                const remainingParticipants = maxParticipants - firstRound
                
                const noRoundsGenerated = Math.ceil(Math.log2(remainingParticipants))
                setNoRounds(noRoundsGenerated)

                let matchesPerRoundGenerated = []
                matchesPerRoundGenerated[0] = firstRound

                for (let i = 1; i < noRoundsGenerated+1; i++) {
                    matchesPerRoundGenerated.push((remainingParticipants / Math.pow(2, i-1)) / 2)
                }
                setMatchesPerRound(matchesPerRoundGenerated)
            }

        } else if (format === 'double-elimination') {

        } else if (format === 'round-robin') {
            
        } else if (format === 'custom') {
            if (customFormatDetails.length === 0) {
                setNoRounds('')
                setMatchesPerRound([])
            } else {
                setNoRounds(customFormatDetails.rounds)
                setMatchesPerRound(customFormatDetails.matchesPerRound)
            }
            
        }

    }, [format, maxParticipants])

    const getCustomFormats = async () => {
        try {
            const res = await getDoc(doc(db, 'customFormats', user.uid))
            const resList = res.data()
            setCustomFormatList(resList.formats)
        } catch (err) {
            console.error(err)
        }
    }

    const saveCustomFormat = async (e) => {
        e.preventDefault()
        if (noRounds === '' || parseInt(noRounds) === 0) {
            setErrorMessage('Number of rounds cannot be empty or 0')
        } else {
            try {
                const res = await getDoc(doc(db, 'customFormats', user.uid))
                const resList = res.data().formats
                const formatExists = resList.some((format) => format.name === newCustomFormatName)

                if (formatExists) {
                    setErrorMessage('Format name already exists')
                } else {
                    const newFormat = {
                        name: newCustomFormatName,
                        rounds: noRounds,
                        matchesPerRound: matchesPerRound,
                    }
                    resList.push(newFormat)
    
                    await updateDoc(doc(db, 'customFormats', user.uid), {
                        formats: resList
                    })
    
                    alert('Format saved successfully')
                    setOpenSaveFormatModal(false)
                }
            } catch (err) {
                console.error(err)
            }
        }
    }

    const searchFormat = async (e) => {
        e.preventDefault()
        try {
            const res = await getDoc(doc(db, 'customFormats', user.uid))
            const resList = res.data().formats.filter((format) => format.name.toLowerCase().includes(searchCriteria.toLowerCase()))
            setCustomFormatList(resList)
        } catch (err) {
            console.error(err)
        }
    }

    const viewCustomFormat = async (formatName) => {
        try {
            const res = await getDoc(doc(db, 'customFormats', user.uid))
            const resList = res.data().formats
            const formatDetails = resList.find((formatDetails) => formatDetails.name === formatName)
            setCustomFormatDetails(formatDetails)
            setOpenViewModal(true)
        } catch (err) {
            console.error(err)
        }
    }

    const saveChanges = async (e) => {
        e.preventDefault()

        const formatChanged = (originalNoRounds !== noRounds || originalMatchesPerRound !== matchesPerRound)

        let roundDict = {}
        for (let i = 1; i <= noRounds; i++) {
            const matchesDict = {}
            const matchInfo = [{},{},{victor: ''}]

            for (let j = 1; j <= matchesPerRound[i - 1]; j++) {
                matchesDict[j] = matchInfo
            }
            roundDict[i] = {
                match: matchesDict,
                time: new Date(startDate),
            }
        }

        try {
            await updateDoc(doc(db, 'tournaments', location.state.id), {
                format: format,
                sport: sport,
                title: title,
                description: description,
                date: {
                    start: new Date(startDate),
                    end: new Date(endDate)
                },
                venue: venue,
                region: region,
                type: type,
                gender: gender,
                maxParticipants: maxParticipants,
                prizes: {
                    first: firstPrize,
                    second: secondPrize,
                    third: thirdPrize
                },
                participants: originalDetails.type !== type ? [] : originalDetails.participants
            })
            
            if (formatChanged) { // If format is changed, reset match statistics to 0
                const res = await getDoc(doc(db, 'matches', location.state.id))
                const resList = res.data()
                const statisticsData = resList.statistics

                let resetZero = {};
                for (const key in statisticsData) {
                    resetZero[key] = {
                        wins: 0,
                        losses: 0,
                        points: 0,
                    }
                }

                await updateDoc(doc(db, 'matches', location.state.id), {
                    round: roundDict,
                    statistics: resetZero,
                })
            }

            if (bannerImg) { // If new banner image is uploaded
                await uploadBytes(ref(getStorage(), `tournaments/${location.state.id}-banner`), bannerImg).then((snapshot) => {
                    getDownloadURL(snapshot.ref).then(function(downloadURL) {
                        updateDoc(doc(db, 'tournaments', location.state.id), {
                            imgURL: downloadURL
                        })
                    })
                })
            }

            alert('Tournament updated successfully')
            window.location.href = `/ViewTournament?id=${location.state.id}`
        } catch (err) {
            console.error(err)
        }
    }


    return (
        <>
        <Box height='100%' width='100%' padding='185px 0 150px' display='flex' justifyContent='center'>
            <Box width='80%' display='flex' gap='100px'>
                <Stack width='100%' gap='50px'>
                    <Box display='flex' alignContent='center'>
                        <Typography variant='h3'>Edit Tournament</Typography>
                    </Box>
                    <form onSubmit={saveChanges}>
                        <Stack gap='50px'>
                            <Stack gap='50px'>
                                <Stack>
                                    <Typography variant='subtitle2' textTransform='capitalize'>Format</Typography>
                                    <Box display='flex' justifyContent='space-between'>
                                        <Button variant='red' sx={{width:'250px', height:'250px', borderRadius:'18px', opacity: format === 'single-elimination' ? '1' : '0.5'}} onClick={() => setFormat('single-elimination')}><img src={require('../../img/buttons/singleElimBtn.png')} width='250px'/></Button>
                                        <Button variant='red' sx={{width:'250px', height:'250px', borderRadius:'18px', opacity: format === 'double-elimination' ? '1' : '0.5'}} onClick={() => setFormat('double-elimination')}><img src={require('../../img/buttons/doubleElimBtn.png')} width='250px'/></Button>
                                        <Button variant='red' sx={{width:'250px', height:'250px', borderRadius:'18px', opacity: format === 'round-robin' ? '1' : '0.5'}} onClick={() => setFormat('round-robin')}><img src={require('../../img/buttons/roundRobinBtn.png')} width='250px'/></Button>
                                        <Button variant='red' sx={{width:'250px', height:'250px', borderRadius:'18px', opacity: format === 'custom' ? '1' : '0.5'}} onClick={() => setFormat('custom')}><img src={require('../../img/buttons/customFormatBtn.png')} width='250px'/></Button>
                                    </Box>
                                </Stack>
                                
                                {format === 'custom' &&
                                    <>
                                    <Box display='flex' justifyContent='space-between'>
                                        <TextField value={noRounds} onChange={(e) => setNoRounds(e.target.value)} className='inputTextField' variant='outlined' label='Number of Rounds' type='number' sx={{width:'180px'}} required/>
                                        <Box display='flex' gap='20px' alignItems='center'>
                                            <Button variant='blue'>Browse Saved Formats</Button>
                                            <Button variant='red'>Save This Format</Button>
                                        </Box>
                                    </Box>

                                    {noRounds > 0 &&
                                        <Stack>
                                            <Typography variant='subtitle2' textTransform='capitalize'>Matches Per Round</Typography>
                                            <Grid container gap='20px' marginTop='10px' alignItems='center'>
                                                {Array.from({ length: noRounds }, (_, i) =>
                                                    <Grid key={i} item>
                                                        <TextField value={matchesPerRound[i] || ''} onChange={(e) => {
                                                                const updatedMatchesPerRound = [...matchesPerRound]
                                                                updatedMatchesPerRound[i] = e.target.value
                                                                setMatchesPerRound(updatedMatchesPerRound)
                                                            }} className='inputTextField' variant='outlined' label={`Round ${i+1}`} type='number' sx={{width:'180px'}} required/>
                                                    </Grid>
                                                )}
                                            </Grid>
                                        </Stack>
                                    }
                                    </>
                                }

                                <hr style={{width:'100%'}}/>
                            </Stack>
                            <Box display='flex' gap='100px'>
                                <Stack gap='25px' width='100%'>
                                    <TextField value={title} onChange={(e) => setTitle(e.target.value)} className='inputTextField' variant='outlined' label='Title' required/>
                                    <TextField value={description} onChange={(e) => setDescription(e.target.value)} className='inputTextField' variant='outlined' label='Description' multiline rows={10} required/>
                                    <Stack width='fit-content'>
                                        <Typography variant='subtitle2' textTransform='capitalize'>New Banner Image</Typography>
                                        <input type="file" accept="image/*"  onChange={(e)=>setBannerImg(e.target.files[0])}/>
                                    </Stack>
                                </Stack>
                                <Stack gap='25px' width='100%'>
                                    <Box display='flex' gap='50px'>
                                        <TextField value={startDate} onChange={(e) => {setStartDate(e.target.value); 
                                            if (e.target.value > endDate) {
                                                setEndDate(e.target.value)
                                              }
                                        }} className='inputTextField' variant='outlined' label='Start Date' type='date' InputProps={{
                                            inputProps: {
                                                min: new Date().toISOString().split('T')[0],
                                            },
                                        }} fullWidth required/>
                                        <TextField value={endDate} onChange={(e) => setEndDate(e.target.value)} className='inputTextField' variant='outlined' label='End Date' type='date' InputProps={{
                                            inputProps: {
                                                min: startDate && new Date(startDate).toISOString().split('T')[0],
                                            },
                                        }} fullWidth required/>
                                    </Box>
                                    <Box display='flex' gap='50px'>
                                        <TextField value={venue} onChange={(e) => setVenue(e.target.value)} className='inputTextField' variant='outlined' label='Venue' fullWidth required/>
                                        <FormControl className='dropdownList' fullWidth>
                                            <InputLabel>Region</InputLabel>
                                            <Select value={region} onChange={(e) => setRegion(e.target.value)} label='Region' required>
                                                {regions.map((region) => {
                                                    return <MenuItem value={region} key={region}><Typography variant='action'>{region}</Typography></MenuItem>
                                                })}
                                            </Select>
                                        </FormControl>
                                    </Box>
                                    <Box display='flex' gap='50px'>
                                        <FormControl className='dropdownList' fullWidth>
                                            <InputLabel>Sport</InputLabel>
                                            <Select value={sport} onChange={(e) => setSport(e.target.value)} label='Sport' required>
                                                {sportList.map((sport) => {
                                                    return <MenuItem value={sport.name} key={sport.name}><Typography variant='action'>{sport.name}</Typography></MenuItem>
                                                })}
                                            </Select>
                                        </FormControl>
                                        <FormControl className='dropdownList' fullWidth>
                                            <InputLabel>Type</InputLabel>
                                            <Select value={type} onChange={(e) => setType(e.target.value)} label='Type' required>
                                                {types.map((type) => {
                                                    return <MenuItem value={type} key={type}><Typography variant='action'>{type}</Typography></MenuItem>
                                                })}
                                            </Select>
                                        </FormControl>                                    </Box>
                                    <Box display='flex' gap='50px'>
                                        <FormControl className='dropdownList' fullWidth>
                                            <InputLabel>Gender</InputLabel>
                                            <Select value={gender} onChange={(e) => setGender(e.target.value)} label='Gender' required>
                                                {genders.map((gender) => {
                                                    return <MenuItem value={gender} key={gender}><Typography variant='action'>{gender}</Typography></MenuItem>
                                                })}
                                            </Select>
                                        </FormControl>
                                        <TextField value={maxParticipants} onChange={(e) => setMaxParticipants(e.target.value)} className='inputTextField' variant='outlined' label='Max Participants' type='number' fullWidth required/>
                                    </Box>
                                </Stack>
                            </Box>
                            <Stack width='100%' gap='10px'>
                                <hr style={{width:'100%'}}/>
                                <Typography variant='subtitle2' textTransform='capitalize'>Optional</Typography>
                                <Box display='flex' gap='50px'>
                                    <TextField value={firstPrize} onChange={(e) => setFirstPrize(e.target.value)} className='inputTextField' variant='outlined' label='First Prize' fullWidth/>
                                    <TextField value={secondPrize} onChange={(e) => setSecondPrize(e.target.value)} className='inputTextField' variant='outlined' label='Second Prize' fullWidth/>
                                    <TextField value={thirdPrize} onChange={(e) => setThirdPrize(e.target.value)} className='inputTextField' variant='outlined' label='Third Prize' fullWidth/>
                                </Box>
                            </Stack>

                            <Stack marginTop='25px' gap='5px'>                                
                                <Box display='flex' gap='50px' justifyContent='center'>
                                    <Button sx={{width:'250px'}} variant='blue' type='submit'>Save Changes</Button>
                                    <Button sx={{width:'120px'}} variant='red' onClick={() => window.history.back()}>Back</Button>
                                </Box>
                            </Stack>
                        </Stack>
                    </form>
                </Stack>
            </Box>
        </Box>

        <Modal open={openSaveFormatModal} onClose={() => {setOpenSaveFormatModal(false); setErrorMessage('')}} disableScrollLock>
            <Box className='ModalView' display='flex' borderRadius='20px' width='300px' padding='30px 0' margin='120px auto' bgcolor='#EEE' justifyContent='center' alignItems='center'>
                <form onSubmit={saveCustomFormat}>
                    <Stack gap='20px'>
                        <Stack>
                            <TextField onChange={(e) => setNewCustomFormatName(e.target.value)} className='inputTextField' variant='outlined' label='Format Name' required/>
                            <Box display='flex' justifyContent='flex-end'><Typography color='red' variant='smallErrorMsg'>{errorMessage}</Typography></Box>
                        </Stack>
                        <Box display='flex' flexDirection='row' justifyContent='space-between'>
                            <Button sx={{width:'120px'}} variant='green' type='submit'>Save</Button>
                            <Button onClick={() => {setOpenSaveFormatModal(false); setErrorMessage('')}} sx={{width:'80px'}} variant='red'>Back</Button>
                        </Box>
                    </Stack>
                </form>
            </Box>
        </Modal>

        <Modal open={openCustomFormatModal} onClose={() => {setOpenCustomFormatModal(false)}} disableScrollLock>
            <Box className='ModalView' display='flex' borderRadius='20px' width='300px' padding='30px' margin='120px auto' bgcolor='#EEE' justifyContent='center' alignItems='center'>
                <Stack width='100%' gap='40px'>
                    <Stack gap='15px'>
                        <form style={{display:'flex', width:'100%'}} onSubmit={searchFormat}>
                            <TextField className='searchTextField' value={searchCriteria} placeholder='SEARCH SAVED FORMATS' onChange={(e) => setSearchCriteria(e.target.value)} sx={{width:'100% !important'}}/>
                            <Button variant='search' type='submit'><SearchRoundedIcon sx={{fontSize:'30px'}}/></Button>
                        </form>
                        <Box bgcolor='white' borderRadius='15px' height='100%' overflow='hidden'>
                            <Stack height='150px' sx={{overflowY:'auto'}}>
                                {customFormatList.map((format) => 
                                    <Stack key={format.name} onClick={() => viewCustomFormat(format.name)} padding='15px' borderBottom='1px solid #E4E4E4' alignItems='center' sx={{cursor:'pointer'}}>
                                        <Box display='flex' width='100%' justifyContent='center' overflow='hidden'>
                                            <Typography sx={{whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}} variant='h5' fontWeight='600'>{format.name}</Typography>
                                        </Box>
                                    </Stack>
                                )}
                            </Stack>
                        </Box>
                    </Stack>
                </Stack>
            </Box>
        </Modal>

        <Modal open={openViewModal} onClose={() => setOpenViewModal(false)} disableScrollLock>
            <Box className='ModalView' display='flex' borderRadius='20px' width='350px' padding='30px' margin='120px auto' bgcolor='#EEE' justifyContent='center' alignItems='center'>
                <Stack width='100%' gap='40px'>
                    <Stack gap='15px'>
                        <Typography textTransform='uppercase' variant='h5'>Format Details:</Typography>
                        <table>
                            <tbody>
                                <tr>
                                    <td width='50%'>
                                        <Typography variant='subtitle2'>Name:</Typography>
                                    </td>
                                    <td>
                                        <Typography variant='subtitle3'>{customFormatDetails.name}</Typography>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <Typography variant='subtitle2'>Rounds:</Typography>
                                    </td>
                                    <td>
                                        <Typography variant='subtitle3'>{customFormatDetails.rounds}</Typography>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <Typography variant='subtitle2'>Matches per Round:</Typography>
                                    </td>
                                    <td>
                                        <Typography textTransform='capitalize' variant='subtitle3'>{customFormatDetails.matchesPerRound?.length === 0 ? 'NIL' : customFormatDetails.matchesPerRound?.join(', ')}</Typography>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </Stack>
                    <Button onClick={() => {
                        setNoRounds(customFormatDetails.rounds)
                        setMatchesPerRound(customFormatDetails.matchesPerRound)
                
                        setOpenCustomFormatModal(false)
                        setOpenViewModal(false)
                    }} variant='blue' fullWidth>Use Format</Button>
                </Stack>
            </Box>
        </Modal>
        </>
    )
}