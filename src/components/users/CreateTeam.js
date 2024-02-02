
import React, { useEffect, useState } from 'react'
import { Box, Button, Checkbox, FormControl, InputLabel, MenuItem, Select, Stack, TextField, Typography } from '@mui/material'
import { db } from '../../config/firebase'
import { UserAuth } from '../../config/authContext'
import { getDocs, collection, doc, addDoc, setDoc, query, where, orderBy  } from 'firebase/firestore'
import { useMediaQuery } from 'react-responsive'

export default function CreateTeam() {
    const isTablet = useMediaQuery({ query: '(max-width: 1020px)' })
    const isMobile = useMediaQuery({ query: '(max-width: 600px)' })

    const { user } = UserAuth()

    const [handle, setHandle] = useState('')
    const [name, setName] = useState('')
    const [region, setRegion] = useState('')
    const [sports, setSports] = useState([])
    const [capacity, setCapacity] = useState('')
    const [gender, setGender] = useState('')
    const [privacy, setPrivacy] = useState('public')
    const [sportsList, setSportsList] = useState([])
    
    const genders = ["male", "female", "mixed"]
    const regions = ["North", "Central", "East", "West", "North-East"]
    const privacies = ["private", "public"]
 
    const [errorMessage, setErrorMessage] = useState('')

    
    useEffect(() => {
        const getSports = async () => {
            try {
                const q = query(collection(db, 'sports'), orderBy('name'))
                const data = await getDocs(q)
                const resList = data.docs.map((doc) => ({...doc.data()}))
                setSportsList(resList)
            } catch (err) {
                console.error(err)
            }
        }
        getSports()
    }, [])

    const concatSports = (e) => {
        const {target: {value}} = e;
        setSports(
            typeof value === 'string' ? value.split(',') : value,
        )
    }
    
    const addTeam = async (e) => {
        e.preventDefault()
        try {          
            const checkUsername = await getDocs(query(collection(db, 'teams'), where('handle', '==', handle.toLowerCase()))) // Check if username is already in use

            if (checkUsername.empty === false) {
                setErrorMessage('Team handle already in use')
            } else {
                await addDoc(collection(db, 'teams'), {
                    handle: handle.toLowerCase(),
                    name: name.trim().toLowerCase(),
                    region: region,
                    sports: sports.slice().sort(),
                    genderReq: gender.toLowerCase(),
                    maxCapacity: capacity,
                    privacy: privacy,
                    leader: user.uid,
                    members: [user.uid]

                }).then((docRef) => {
                    setDoc(doc(db, "profiles", docRef.id), {
                        first: 0,
                        second: 0,
                        third: 0,
                        tournamentsParticipated: 0
                    })
                    alert('Team has been created')
                    window.location.href = '/ManageAccountProfile'  
                })
            }
        } catch (err) {
            console.error(err)
        }
    };

    
    return (
        <Box height='100%' width='100%' padding={isMobile ? '120px 0 150px' : isTablet ? '150px 0 150px' : '185px 0 150px'} display='flex' justifyContent='center'>
            <Box width={isMobile || isTablet ? '90%' : '80%'} display='flex' gap='100px'>
                <Stack width='100%'>
                    <Box display='flex' alignContent='center'>
                        <Typography variant='h3'>Create Team</Typography>
                    </Box>
                    <form style={{marginTop:'50px'}} onSubmit={addTeam}> 
                        <Stack gap='25px' width='100%'>        
                            <TextField value={handle} onChange={(e) => setHandle(e.target.value)} className='inputTextField' variant='outlined' label='Handle' inputProps={{pattern:'^[A-Za-z0-9_]+$'}} required/>
                            <TextField value={name} onChange={(e) => setName(e.target.value)} className='inputTextField' variant='outlined' label='Display Name' inputProps={{pattern:'^[^0-9]+$'}} required/>

                            <FormControl className='dropdownList'>
                                <InputLabel>Region</InputLabel>
                                <Select value={region} onChange={(e) => setRegion(e.target.value)} label='Region' required>
                                    {regions.map((region) => {
                                        return <MenuItem value={region} key={region}><Typography variant='action'>{region}</Typography></MenuItem>
                                    })}
                                </Select>
                            </FormControl>

                            <FormControl className='dropdownList'>
                                <InputLabel>Sport(s)</InputLabel>
                                <Select label='Sport(s)' sx={{textTransform:'uppercase', fontWeight:'bold'}} value={sports} onChange={concatSports} renderValue={(selected) => selected.join(', ')} multiple required>
                                    {sportsList?.map((sport) => {
                                        return <MenuItem value={sport.name} key={sport.name}>
                                            <Checkbox checked={sports.indexOf(sport.name) > -1} />
                                            <Typography variant='action'>{sport.name}</Typography>
                                        </MenuItem>
                                    })}
                                </Select>
                            </FormControl>
                            
                            <Box display='flex' gap={isTablet ? '20px' : '50px'}>
                                <TextField fullWidth value={capacity} onChange={(e) => setCapacity(e.target.value)} className='inputTextField' variant='outlined' label='Max Capacity' inputProps={{pattern:'^[0-9_]+$'}} required/>

                                <FormControl className='dropdownList' fullWidth>
                                    <InputLabel>Gender</InputLabel>
                                    <Select label='Gender' value={gender} onChange={(e) => setGender(e.target.value)} required>
                                        {genders.map((gender) => {
                                            return <MenuItem value={gender} key={gender}><Typography variant='action'>{gender}</Typography></MenuItem>
                                        })}
                                    </Select>
                                </FormControl>

                                <FormControl className='dropdownList' fullWidth>
                                    <InputLabel>Privacy</InputLabel>
                                    <Select label='privacy' value={privacy} onChange={(e) => setPrivacy(e.target.value)} required>
                                        {privacies.map((privacy) => {
                                            return <MenuItem value={privacy} key={privacy}><Typography variant='action'>{privacy}</Typography></MenuItem>
                                        })}
                                    </Select>
                                </FormControl>
                            </Box>

                            <Stack marginTop='25px' gap='5px'>
                                <Typography color='red' variant='errorMsg'>{errorMessage}</Typography>

                                <Box display='flex' gap={isTablet ? '20px' : '50px'} justifyContent={isTablet ? 'center' : 'flex-start'}>
                                    <Button sx={{width:(isMobile ? '100%' : '250px')}} variant='blue' type='submit' >Create Team</Button>
                                    <Button sx={{width:(isMobile ? '50%' : '120px')}} variant='red' onClick={() => window.location.href = `/ManageAccountProfile`}>Back</Button>
                                </Box>
                            </Stack>
                        </Stack>       
                    </form>
                </Stack>
            </Box>
        </Box>
    )
}