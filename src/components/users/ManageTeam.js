import React, { useEffect, useState } from 'react'
import { Box, Button, Card, CardActionArea, CardContent, Checkbox, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, FormControl, Grid, InputLabel, MenuItem, Modal, Select, Stack, TextField, Typography } from '@mui/material'
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { db } from '../../config/firebase'
import { UserAuth } from '../../config/authContext'
import { getDoc, getDocs, updateDoc, collection, deleteDoc, doc, where, query, orderBy, documentId } from 'firebase/firestore'

export default function ManageTeam() {
    const { user } = UserAuth()

    const [openViewModal, setOpenViewModal] = useState(false)
    const [openAddMemberModal, setOpenAddMemberModal] = useState(false)
    const [editMode, setEditMode] = useState(false)
    const [openConfirmation, setOpenConfirmation] = useState(false)
    const [openDisbandConfirmation, setOpenDisbandConfirmation] = useState(false)

    const [originalDetails, setOriginalDetails] = useState({})
    const [id, setId] = useState('')
    const [handle, setHandle] = useState('')
    const [name, setName] = useState('')
    const [region, setRegion] = useState('')
    const [sports, setSports] = useState([])
    const [maxCapacity, setMaxCapacity] = useState('')
    const [genderReq, setGenderReq] = useState('')
    const [privacy, setPrivacy] = useState('')

    const [profileInfo, setProfileInfo] = useState({})
    const [accountsList, setAccountsList] = useState([])
    const [accountDetails, setAccountDetails] = useState({})

    const [sportsList, setSportsList] = useState([])
    const genders = ["male", "female", "mixed"]
    const regions = ["North", "Central", "East", "West", "North-East"]
    const privacies = ["private", "public"]

    const [errorMessage, setErrorMessage] = useState('')

    const [searchCriteria, setSearchCriteria] = useState('')
    const [searchAccountsList, setSearchAccountsList] = useState([])


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
        const getTeam = async () => {
            try {
                const q = query(collection(db, 'teams'), where('leader', '==', user.uid))
                const data = await getDocs(q)
                const resList = data.docs.map((doc) => ({...doc.data(), id: doc.id}))
                setOriginalDetails(resList)

                setId(resList[0]?.id)
                setHandle(resList[0]?.handle)
                setName(resList[0]?.name)
                setRegion(resList[0]?.region)
                setSports(resList[0]?.sports)
                setMaxCapacity(resList[0]?.maxCapacity)
                setGenderReq(resList[0]?.genderReq)
                setPrivacy(resList[0]?.privacy)
            } catch (err) {
                console.error(err)
            }
        }
        const getProfile = async () => {
            try {
                const res = await getDoc(doc(db, 'profiles', user.uid))
                const resList = res.data()
                setProfileInfo(resList)
            } catch (err) {
                console.error(err)
            }
        }
        getSports()
        getTeam()
        getProfile()
    }, [])

    const viewAccount = async (id) => { // Handle view record by populating data to modal
        setOpenViewModal(true)
        try {
            const resList = await getDoc(doc(db, 'accounts', id))
            const appendID = resList.data()
            appendID.id = id // Append id to list
            setAccountDetails(appendID)
        } catch (err) {
            console.error(err)
        }
    }

    const concatSports = (e) => {
        const {target: {value}} = e;
        setSports(
            typeof value === 'string' ? value.split(',') : value,
        )
    }

    const updateTeam = async (e) => {
        e.preventDefault()
        if (handle.toLowerCase() !== originalDetails[0]?.handle) {
            try {
                const checkHandle = await getDocs(query(collection(db, 'teams'), where('handle', '==', handle.toLowerCase()))) // Check if handle is already in use
                if (checkHandle.empty === false) {
                    setErrorMessage('Team handle already in use')
                    return
                }
            } catch (err) {
                console.error(err)
            }
        }
        
        try {
            await updateDoc(doc(db, 'teams', id), {
                handle: handle.toLowerCase(),
                name: name,
                region: region,
                sports: sports,
                maxCapacity: maxCapacity,
                genderReq: genderReq,
                privacy: privacy
            })
            alert('Team updated successfully')
            window.location.reload()
        } catch (err) {
            console.error(err)
        }
    }

    const searchAccount = async (e) => { // Handle search record of accounts not belonging to any teams
        e.preventDefault()
        if (searchCriteria === '') { // If search criteria is empty, return empty results
            setSearchAccountsList([])
        } else { // If search criteria is not empty, retrieve accounts that match the search criteria
            try {
                const allAccountsQuery = query(collection(db, 'accounts'), orderBy('username'))
                const allAccountsDocs = await getDocs(allAccountsQuery)
                const allAccounts = allAccountsDocs.docs.map(doc => doc.id)
    
                const allTeamsQuery = query(collection(db, 'teams'), orderBy('handle'))
                const allTeamsDocs = await getDocs(allTeamsQuery)
                const teamIds = allTeamsDocs.docs.map(doc => doc.data().members)
    
                const allTeamMembers = teamIds.flat()
                const accountsNotInTeam = allAccounts.filter(accountId => !allTeamMembers.includes(accountId))
    
                const q = query(collection(db, 'accounts'), where(documentId(), 'in', accountsNotInTeam))
                const data = await getDocs(q)
                const resList = data.docs.map(doc => ({ ...doc.data(), id: doc.id })).filter(account => account.type !== 'admin' && (account.username.includes(searchCriteria.toLowerCase()) || account.fullName.includes(searchCriteria.toLowerCase())))
    
                setSearchAccountsList(resList)
            } catch (err) {
                console.error(err)
            }
        }
    }

    const addMember = async (id) => {
        try {
            await updateDoc(doc(db, 'teams', originalDetails[0]?.id), {
                members: [...originalDetails[0]?.members, id]
            })
            setOriginalDetails(prevDetails => {
                return [{ ...prevDetails[0], members: [...originalDetails[0]?.members, id] }, ...prevDetails.slice(1)]
            })
            alert('Member added successfully')
            setOpenViewModal(false)
            setSearchAccountsList([])
            setSearchCriteria('')
        } catch (err) {
            console.error(err)
        }
    }

    const kickMember = async (id) => {
        try {
            await updateDoc(doc(db, 'teams', originalDetails[0]?.id), {
                members: originalDetails[0]?.members.filter(member => member !== id)
            })
            setOriginalDetails(prevDetails => {
                const updatedMembers = prevDetails[0]?.members.filter(member => member !== id)
                return [{ ...prevDetails[0], members: updatedMembers }, ...prevDetails.slice(1)]
            })
            alert('Member kicked successfully')
            setOpenConfirmation(false)
            setOpenViewModal(false)
        } catch (err) {
            console.error(err)
        }
    }

    useEffect(() => { // Live update on members list on kick/add member
        const getTeam = async () => {
            try {
                const q = query(collection(db, 'teams'), where('members', 'array-contains', user.uid))
                const data = await getDocs(q)
                const resList = data.docs.map((doc) => ({...doc.data(), id: doc.id}))

                try {
                    const q = query(collection(db, 'accounts'), orderBy('username'))
                    const data = await getDocs(q)
                    const accResList = data.docs.map((doc) => ({ ...doc.data(), id: doc.id })).filter((item) => resList[0]?.members?.includes(item.id))
                    setAccountsList(accResList)
                } catch (err) {
                    console.error(err)
                }
            } catch (err) {
                console.error(err)
            }
        }
        getTeam()
    }, [originalDetails[0]?.members])

    const disbandTeam = async (id) => {
        try {
            await deleteDoc(doc(db, 'teams', id))
            alert('Team disbanded successfully')
            window.location.href = '/ManageAccountProfile'
        } catch (err) {
            console.error(err)
        }
    }

    const revertChanges = () => {
        setHandle(originalDetails[0]?.handle)
        setName(originalDetails[0]?.name)
        setRegion(originalDetails[0]?.region)
        setSports(originalDetails[0]?.sports)
        setMaxCapacity(originalDetails[0]?.maxCapacity)
        setGenderReq(originalDetails[0]?.genderReq)
        setPrivacy(originalDetails[0]?.privacy)
    }

    const toggleEditMode = (val) => {
        setErrorMessage('')
        setEditMode(val)
    }


    return (
        <>
        <Box height='100%' width='100%' padding='185px 0 150px' display='flex' justifyContent='center'>
            <Box width='80%' display='flex' gap='100px'>
                <Stack width='100%' gap='50px'>
                    <Box display='flex' alignContent='center'>
                        <Typography variant='h3'>{editMode ? 'Edit' : 'Manage'} Team</Typography>
                    </Box>

                    {editMode ?
                        <>
                        <form onSubmit={updateTeam}>
                            <Box display='flex' gap='50px'>
                                <Stack width='100%'>
                                    <Box display='flex' justifyContent='space-between' alignItems='center'>
                                        <Box display='flex' gap='25px' alignItems='center'>
                                            <TextField value={name} onChange={(e) => setName(e.target.value)} className='inputTextField' variant='outlined' label='Name' inputProps={{pattern:'^[^0-9]+$'}} required/>
                                            <TextField value={handle} onChange={(e) => setHandle(e.target.value)} className='inputTextField' variant='outlined' label='Handle' inputProps={{pattern:'^[A-Za-z0-9_]+$'}} required/>
                                        </Box>
                                        <Button onClick={() => setOpenDisbandConfirmation(true)} variant='red'>Disband</Button>
                                    </Box>
                                    <hr width='100%'/>
                                    <Box display='flex' marginTop='25px' gap='50px'>
                                        <Stack gap='25px' width='50%'>
                                            <FormControl className='dropdownList'>
                                                <InputLabel>Region</InputLabel>
                                                <Select value={region} onChange={(e) => setRegion(e.target.value)} label='Region' required>
                                                    {regions.map((region) => {
                                                        return <MenuItem value={region} key={region}><Typography variant='action'>{region}</Typography></MenuItem>
                                                    })}
                                                </Select>
                                            </FormControl>
                                            <FormControl className='dropdownList' fullWidth>
                                                <InputLabel>Gender</InputLabel>
                                                <Select label='Gender' value={genderReq} onChange={(e) => setGenderReq(e.target.value)} required>
                                                    {genders.map((gender) => {
                                                        return <MenuItem value={gender} key={gender}><Typography variant='action'>{gender}</Typography></MenuItem>
                                                    })}
                                                </Select>
                                            </FormControl>
                                            <TextField value={maxCapacity} onChange={(e) => setMaxCapacity(e.target.value)} className='inputTextField' variant='outlined' label='Max Capacity' type='number' required/>
                                        </Stack>
                                        <Stack gap='25px' width='50%'>
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
                                            <FormControl className='dropdownList' fullWidth>
                                                <InputLabel>Privacy</InputLabel>
                                                <Select label='privacy' value={privacy} onChange={(e) => setPrivacy(e.target.value)} required>
                                                    {privacies.map((privacy) => {
                                                        return <MenuItem value={privacy} key={privacy}><Typography variant='action'>{privacy}</Typography></MenuItem>
                                                    })}
                                                </Select>
                                            </FormControl>
                                        </Stack>
                                    </Box>
                                </Stack>

                                <Stack width='100%'>
                                    <Box display='flex' justifyContent='space-between'>
                                        <Box display='flex' gap='25px' alignItems='center'>
                                            <Typography textTransform='uppercase' letterSpacing='5px' variant='h5' fontWeight='600'>Members</Typography>
                                            <Typography color='#222'>{accountsList.length}/{originalDetails[0]?.maxCapacity}</Typography>
                                        </Box>
                                        <Button style={{height:'40px', width:'65px'}} variant='green' onClick={() => setOpenAddMemberModal(true)} disabled={String(accountsList.length) === String(originalDetails[0]?.maxCapacity)}><PersonAddIcon sx={{fontSize:'30px'}}/></Button>
                                    </Box>
                                    <hr width='100%'/>
                                    <Grid container gap='20px' marginTop='25px' alignItems='center'>
                                        {accountsList.map((account) => (
                                            <Grid key={account.id} item borderRadius='15px' boxShadow='0 5px 15px rgba(0, 0, 0, 0.2)'>
                                                <Card sx={{bgcolor:'#EEE', textAlign:'center', borderRadius:'15px'}} >
                                                    <CardActionArea onClick={() => viewAccount(account.id)}>
                                                        <CardContent sx={{margin:'16px', overflow:'hidden'}}>
                                                            {originalDetails[0]?.leader === account.id && <img src={require('../../img/icons/crown.png')} height='20px'/>}
                                                            <Typography variant='h5'>@{account.username}</Typography>
                                                            <Typography textTransform='capitalize' variant='subtitle4'>{account.fullName}</Typography>
                                                        </CardContent>
                                                    </CardActionArea>
                                                </Card>
                                            </Grid>
                                        ))}
                                    </Grid>
                                </Stack>
                            </Box>
                            <Box marginTop='75px' display='flex' justifyContent='center'>
                                <Stack gap='5px'>
                                    <Typography color='red' variant='errorMsg'>{errorMessage}</Typography>
                                    <Box display='flex' gap='50px' justifyContent='center'>
                                        <Button sx={{width:'250px'}} variant='blue' type='submit'>Save Changes</Button>
                                        <Button sx={{width:'120px'}} variant='red' onClick={() => {toggleEditMode(false); revertChanges()}}>Back</Button>
                                    </Box>
                                </Stack>
                            </Box>
                        </form>
                        </>
                        :
                        <>
                        <Box display='flex' gap='50px'>
                            <Stack width='100%'>
                                <Box display='flex' gap='25px' alignItems='center'>
                                    <Typography variant='h5'>{name}</Typography>
                                    <Typography color='#222'>@{handle}</Typography>
                                </Box>
                                
                                <hr width='100%'/>
                                <Box display='flex' marginTop='25px'>
                                    <Stack gap='25px' width='50%'>
                                        <Stack>
                                            <Typography fontWeight='bold' variant='body1'>Region</Typography>
                                            <Typography variant='body1' color='#222' textTransform='capitalize'>{region}</Typography>
                                        </Stack>
                                        <Stack>
                                            <Typography fontWeight='bold' variant='body1'>Gender</Typography>
                                            <Typography variant='body1' color='#222' textTransform='capitalize'>{genderReq}</Typography>
                                        </Stack>
                                    </Stack>
                                    <Stack gap='25px' width='50%'>
                                        <Stack>
                                            <Typography fontWeight='bold' variant='body1'>Sport(s)</Typography>
                                            <Typography variant='body1' color='#222' textTransform='capitalize'>{sports.join(', ')}</Typography>
                                        </Stack>
                                        <Stack>
                                            <Typography fontWeight='bold' variant='body1'>Group Privacy</Typography>
                                            <Typography variant='body1' color='#222' textTransform='capitalize'>{privacy}</Typography>
                                        </Stack>
                                    </Stack>
                                </Box>
                            </Stack>

                            <Stack width='100%'>
                                <Box display='flex' justifyContent='space-between'>
                                    <Box display='flex' gap='25px' alignItems='center'>
                                        <Typography textTransform='uppercase' letterSpacing='5px' variant='h5' fontWeight='600'>Members</Typography>
                                        <Typography color='#222'>{accountsList.length}/{maxCapacity}</Typography>
                                    </Box>
                                    <Button onClick={(e) => {toggleEditMode(true)}} sx={{height:'30px'}} variant='blue'>Edit Team</Button>
                                </Box>
                                <hr width='100%'/>
                                <Grid container gap='20px' marginTop='25px' alignItems='center'>
                                    {accountsList.map((account) => (
                                        <Grid key={account.id} item borderRadius='15px' boxShadow='0 5px 15px rgba(0, 0, 0, 0.2)'>
                                            <Card sx={{bgcolor:'#EEE', textAlign:'center', borderRadius:'15px'}} >
                                                <CardActionArea onClick={() => viewAccount(account.id)}>
                                                    <CardContent sx={{margin:'16px', overflow:'hidden'}}>
                                                        {originalDetails[0]?.leader === account.id && <img src={require('../../img/icons/crown.png')} height='20px'/>}
                                                        <Typography variant='h5'>@{account.username}</Typography>
                                                        <Typography textTransform='capitalize' variant='subtitle4'>{account.fullName}</Typography>
                                                    </CardContent>
                                                </CardActionArea>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Stack>
                        </Box>
                        <Stack gap='25px'>
                            <Stack gap='10px'>
                                <Typography textTransform='uppercase' letterSpacing='5px' variant='h5' fontWeight='600'>Statistics</Typography>
                                <hr width='100%'/>
                            </Stack>
                            <Box display='flex' justifyContent='space-between' alignItems='center' gap='50px'>
                                <Stack width='100%'>
                                    <Typography fontWeight='bold' variant='body1'>Medals</Typography>
                                    <Box display='flex' gap='25px'>
                                        <Box display='flex' gap='5px'>
                                            <img width='25px' src={require('../../img/icons/first.png')}/>
                                            <Typography variant='body1' color='#222'>{profileInfo?.first}</Typography>
                                        </Box>
                                        <Box display='flex' gap='5px'>
                                            <img width='25px' src={require('../../img/icons/second.png')}/>
                                            <Typography variant='body1' color='#222'>{profileInfo?.second}</Typography>
                                        </Box>
                                        <Box display='flex' gap='5px'>
                                            <img width='25px' src={require('../../img/icons/third.png')}/>
                                            <Typography variant='body1' color='#222'>{profileInfo?.third}</Typography>
                                        </Box>
                                    </Box>
                                </Stack>
                                <Stack width='100%'>
                                    <Typography fontWeight='bold' variant='body1'>Tournaments Played</Typography>
                                    <Box display='flex'>
                                        <Typography variant='body1' color='#222'>{profileInfo?.tournamentsParticipated}</Typography>
                                    </Box>
                                </Stack>
                            </Box>
                        </Stack>
                        </>
                    }
                </Stack>
            </Box>
        </Box>

        <Modal open={openViewModal} onClose={() => {setOpenViewModal(false)}} disableScrollLock>
            <Box className='ModalView' display='flex' borderRadius='20px' width='400px' padding='30px' margin='120px auto' bgcolor='#EEE' justifyContent='center' alignItems='center'>
                <Stack width='100%' gap='40px'>
                    <Stack gap='15px'>
                        <Typography textTransform='uppercase' variant='h5'>Member Details:</Typography>
                        <table>
                            <tbody>
                                <tr>
                                    <td width='120px'>
                                        <Typography variant='subtitle2'>Username:</Typography>
                                    </td>
                                    <td>
                                        <Typography variant='subtitle3'>{accountDetails.username}</Typography>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <Typography variant='subtitle2'>Full Name:</Typography>
                                    </td>
                                    <td>
                                        <Typography textTransform='capitalize' variant='subtitle3'>{accountDetails.fullName}</Typography>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <Typography variant='subtitle2'>Gender:</Typography>
                                    </td>
                                    <td>
                                        <Typography textTransform='capitalize' variant='subtitle3'>{accountDetails.gender}</Typography>
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
                                <tr>
                                    <td>
                                        <Typography variant='subtitle2'>Sport(s):</Typography>
                                    </td>
                                    <td>
                                        <Typography textTransform='capitalize'variant='subtitle3'>{accountDetails?.sportInterests?.join(', ')}</Typography>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </Stack>

                    {editMode ?
                        (!openAddMemberModal ?
                            (originalDetails[0]?.leader !== accountDetails?.id && <Button onClick={() => setOpenConfirmation(true)} variant='red' fullWidth>Kick Member</Button>)
                            :
                            <Box display='flex' gap='50px'>
                                <Button onClick={() => addMember(accountDetails?.id)} variant='blue' fullWidth>Add Member</Button>
                                <Button onClick={() => setOpenViewModal(false)} variant='red' fullWidth>Back</Button>
                            </Box>
                        )
                        :
                        <Button variant='blue' onClick={() => window.location.href=`/ViewProfile?id=${accountDetails.id}`}>View Profile</Button>
                    }
                </Stack>
            </Box>
        </Modal>

        <Modal open={openAddMemberModal} onClose={() => {setOpenAddMemberModal(false)}} disableScrollLock>
            <Box className='ModalView' display='flex' borderRadius='20px' width='400px' padding='30px' margin='120px auto' bgcolor='#EEE' justifyContent='center' alignItems='center'>
                <Stack width='100%' gap='40px'>
                    <Stack gap='30px'>
                        <form style={{display:'flex', width:'100%'}} onSubmit={searchAccount}>
                            <TextField className='searchTextField' value={searchCriteria} placeholder='SEARCH USER' onChange={(e) => setSearchCriteria(e.target.value)} sx={{width:'100% !important'}}/>
                            <Button variant='search' type='submit'><SearchRoundedIcon sx={{fontSize:'30px'}}/></Button>
                        </form>
                        <Grid container gap='10px' alignItems='stretch' maxHeight='175px' sx={{overflowY:'auto'}}>
                            {searchAccountsList.map((account) => (
                                <Grid key={account.id} item width='100%' borderRadius='15px'>
                                    <Card sx={{bgcolor:'white', textAlign:'center', height:'75px', borderRadius:'15px'}} >
                                        <CardActionArea sx={{height:'75px'}} onClick={() => viewAccount(account.id)}>
                                            <CardContent sx={{margin:'0 20px', overflow:'hidden'}}>
                                                <Typography variant='h5'>@{account.username}</Typography>
                                                <Typography textTransform='capitalize' variant='subtitle4'>{account.fullName}</Typography>
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

        <React.Fragment>
            <Dialog open={openConfirmation} onClose={() => setOpenConfirmation(false)}>
                <DialogTitle>
                    Kick Member
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to kick this member?
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{padding:'0 24px 16px'}}>
                    <Button onClick={() => kickMember(accountDetails?.id)} variant='blue'>Yes</Button>
                    <Button onClick={() => setOpenConfirmation(false)} variant='red' autoFocus>No</Button>
                </DialogActions>
            </Dialog>
        </React.Fragment>

        <React.Fragment>
            <Dialog open={openDisbandConfirmation} onClose={() => setOpenDisbandConfirmation(false)}>
                <DialogTitle>
                    Disband Team
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to disband this team?
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{padding:'0 24px 16px'}}>
                    <Button onClick={() => disbandTeam(id)} variant='blue'>Yes</Button>
                    <Button onClick={() => setOpenDisbandConfirmation(false)} variant='red' autoFocus>No</Button>
                </DialogActions>
            </Dialog>
        </React.Fragment>
        </>
    )
}