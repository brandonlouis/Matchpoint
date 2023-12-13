
import React, { useEffect, useState } from 'react'
import { Box, Button, Checkbox, FormControl, InputLabel, MenuItem, Select, Stack, TextField, Typography } from '@mui/material'
import { db } from '../../config/firebase'
import { getDoc, getDocs, updateDoc, collection, doc, where, query, orderBy, or, addDoc } from 'firebase/firestore'

export default function CreateTeam() {    
    const [handle, setHandle] = useState('')
    const [name, setName] = useState('')
    const [region, setRegion] = useState('')
    const regions = ["North", "Central", "East", "West", "North-East"]
    const [sports, setSports] = useState([]);

    const [sportsList, setSportsList] = useState([])
    const [capacity, setCapacity] = useState('')
    const [gender, setGender] = useState('')
    const genders = ["male", "female"]
    const [privacy, setprivacy] = useState('')
    const privacys = ["private", "public"]
    

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
            await addDoc(collection(db, 'teams'), {
                handle: handle.toLowerCase(),
                name: name.trim().toLowerCase(),
                region: region,
                sportInterests: sports.slice().sort(),
                maxCapacity: capacity,
                gender: gender.toLowerCase(),
                privacy: privacy,
                
                
            });
            alert('Team has been created')
            window.location.href = '/ManageAccountProfile'          
        } catch (err) {
            console.error(err)
        }
    };

    
    return (
        
        <Box height='100%' width='100%' padding='185px 0 150px' display='flex' justifyContent='center'>
            <Box width='80%' display='flex' gap='100px'>
            <Stack width='50%'>
            <Box display='flex' justifyContent='space-between' alignContent='center'>
            <Typography variant='h3'>Create Team</Typography>
            </Box>
            <form style={{marginTop:'50px'}} onSubmit={addTeam}> 
                <Stack gap='25px' width='100%'>        
            <TextField value={handle} onChange={(e) => setHandle(e.target.value)} className='inputTextField' variant='outlined' label='Handle' inputProps={{pattern:'^[A-Za-z0-9_]+$'}} />
            <TextField value={name} onChange={(e) => setName(e.target.value)} className='inputTextField' variant='outlined' label='Display Name' inputProps={{pattern:'^[A-Za-z0-9_]+$'}} />

            <FormControl className='dropdownList'>
                <InputLabel>Region</InputLabel>
                    <Select value={region} onChange={(e) => setRegion(e.target.value)} label='Region'>
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
            
            <TextField value={capacity} onChange={(e) => setCapacity(e.target.value)} className='inputTextField' variant='outlined' label='Max Capacity' inputProps={{pattern:'^[0-9_]+$'}} />

             <FormControl className='dropdownList' >
                <InputLabel>Gender</InputLabel>
                <Select label='Gender' value={gender} onChange={(e) => setGender(e.target.value)} >
                    {genders.map((gender) => {
                        return <MenuItem value={gender} key={gender}><Typography variant='action'>{gender}</Typography></MenuItem>
                    })}
                </Select>
            </FormControl>
            

            <FormControl className='dropdownList' >
                <InputLabel>Privacy</InputLabel>
                <Select label='privacy' value={privacy} onChange={(e) => setprivacy(e.target.value)} >
                    {privacys.map((privacy) => {
                        return <MenuItem value={privacy} key={privacy}><Typography variant='action'>{privacy}</Typography></MenuItem>
                    })}
                </Select>
            </FormControl>


            <Stack marginTop='25px' gap='5px'>                                    
                <Box display='flex' gap='20px' sx={{justifyContent: 'flex-start'}}>
                    {
                        <>
                            <Button sx={{width:'250px'}} variant='blue' type='submit' >Create Team</Button>
                            <Button sx={{width:'120px'}} variant='red' onClick={() => window.location.href = `/ManageAccountProfile`}>Back</Button>
                            
                        </>                                                
                    }
                </Box>
            </Stack>
            
            
                                    
            

                                  
            </Stack>       
            </form>
            </Stack>
            </Box>
            </Box>
            
            
        
            
    )
}

