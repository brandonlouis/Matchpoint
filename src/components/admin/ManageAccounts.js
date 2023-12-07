import React, { useEffect, useState } from 'react'
import { Box, Button, Card, CardActionArea, CardContent, Grid, Modal, Stack, TextField, Typography } from '@mui/material'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { useNavigate } from 'react-router-dom';
import { db } from '../../config/firebase';
import { getDocs, getDoc, doc, collection } from 'firebase/firestore';

export default function ManageAccounts() {
    const [openModal, setOpenModal] = useState(false)

    const [accountsList, setAccountsList] = useState([])
    const [accountDetails, setAccountDetails] = useState({})

    const [searchCriteria, setSearchCriteria] = useState('')

    // TODO: Handle delete functionality

    useEffect(() => { // Handle retrieving account list on initial load
        const getAccounts = async () => {
            try {
                const data = await getDocs(collection(db, 'accounts'))
                const resList = data.docs.map((doc) => ({...doc.data(), id: doc.id})).filter(account => account.type !== 'admin')
                setAccountsList(resList)
            } catch (err) {
                console.error(err)
            }
        }
        getAccounts()
    },[])

    const viewAccount = async (id) => { // Handle view record by populating data to modal
        setOpenModal(true)
        try {
            const resList = await getDoc(doc(db, 'accounts', id))
            const appendID = resList.data()
            appendID.id = id // Append id to list
            setAccountDetails(appendID)
        } catch (err) {
            console.error(err)
        }
    }

    const searchRecord = async (e) => { // Handle search record
        e.preventDefault()
        try {
            if (searchCriteria === '') { // If search criteria is empty, retrieve all accounts
                const data = await getDocs(collection(db, 'accounts'))
                const resList = data.docs.map((doc) => ({...doc.data(), id: doc.id})).filter(account => account.type !== 'admin')
                setAccountsList(resList)
                return
            } else { // If search criteria is not empty, retrieve accounts that match the search criteria
                const data = await getDocs(collection(db, 'accounts'))
                const resList = data.docs.map((doc) => ({...doc.data(), id: doc.id})).filter(account => account.type !== 'admin')
    
                const filteredList = resList.filter(account => account.username == searchCriteria.toLowerCase() || account.fullName == searchCriteria.toLowerCase())
                setAccountsList(filteredList)
            }
        } catch (err) {
            console.error(err)
        }
    }

    const navigate = useNavigate()
    const editAccount=(param)=>{
        navigate('/EditAccount',{state:{id:param}}) // Handle navigation while passing user ID as parameter
    }

    
    return (
        <>
        <Box height='100%' width='100%' padding='185px 0 150px' display='flex' justifyContent='center'>
            <Stack width='80%'>
                <Box display='flex' justifyContent='space-between' alignItems='center'>
                    <Typography variant='h3'>Manage Accounts</Typography>
                    <Box>
                        <form style={{display:'flex'}} onSubmit={searchRecord}>
                            <TextField className='searchTextField' placeholder='SEARCH' onChange={(e) => setSearchCriteria(e.target.value)}/>
                            <Button variant='search' type='submit'><SearchRoundedIcon sx={{fontSize:'30px'}}/></Button>
                        </form>
                    </Box>
                </Box>
                <Grid container gap='35px' alignItems='stretch' marginTop='50px'>
                    {accountsList.map((account) => (
                        <Grid key={account.id} item width='150px' borderRadius='15px' boxShadow='0 5px 15px rgba(0, 0, 0, 0.2)'>
                            <Card sx={{bgcolor:'#EEE', textAlign:'center', height:'150px', borderRadius:'15px'}} >
                                <CardActionArea sx={{height:'150px'}} onClick={() => viewAccount(account.id)}>
                                    {account.type !== 'event coordinator' ?
                                        <CardContent sx={{margin:'16px', overflow:'hidden'}}>
                                            <img src={require(`../../img/flags/${account.country}.png`)} width='20px' style={{ marginBottom: '10px' }}/>
                                            <Typography variant='h5'>@{account.username}</Typography>
                                            <Typography textTransform='capitalize' variant='subtitle4'>{account.fullName}</Typography>
                                        </CardContent>
                                        :
                                        <CardContent sx={{margin:'16px', overflow:'hidden'}}>
                                            <Typography color='#CB3E3E' variant='h5'>Event Coordinator</Typography>
                                            <Typography textTransform='capitalize' variant='subtitle4'>{account.fullName}</Typography>
                                        </CardContent>
                                    }
                                </CardActionArea>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Stack>
        </Box>

        <Modal open={openModal} onClose={() => setOpenModal(false)} disableScrollLock>
            <Box className='ModalView' display='flex' borderRadius='20px' width='400px' padding='50px' margin='120px auto' bgcolor='#EEE' justifyContent='center' alignItems='center'>
                <Stack width='100%' gap='40px'>
                    
                    <Stack gap='15px'>
                        <Typography textTransform='uppercase' variant='h5'>Account Details:</Typography>
                        
                        <table>
                            <tbody>
                                <tr>
                                    <td width='35%'>
                                        <Typography variant='subtitle2'>Account ID:</Typography>
                                    </td>
                                    <td>
                                        <Typography variant='subtitle3'>{accountDetails.id}</Typography>
                                    </td>
                                </tr>
                                {accountDetails.type !== 'event coordinator' &&
                                    <tr>
                                        <td>
                                            <Typography variant='subtitle2'>Username:</Typography>
                                        </td>
                                        <td>
                                            <Typography variant='subtitle3'>{accountDetails.username}</Typography>
                                        </td>
                                    </tr>
                                }
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
                                        <Typography variant='subtitle2'>Email:</Typography>
                                    </td>
                                    <td>
                                        <Typography variant='subtitle3'>{accountDetails.email}</Typography>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <Typography variant='subtitle2'>Phone Number:</Typography>
                                    </td>
                                    <td>
                                        <Typography variant='subtitle3'>+{accountDetails.countryCode} {accountDetails.phoneNumber}</Typography>
                                    </td>
                                </tr>
                                {accountDetails.type !== 'event coordinator' &&
                                    <tr>
                                        <td>
                                            <Typography variant='subtitle2'>Country:</Typography>
                                        </td>
                                        <td>
                                            <Typography sx={{textTransform:'capitalize'}} variant='subtitle3'>{accountDetails.country}</Typography>
                                        </td>
                                    </tr>
                                }
                            </tbody>
                        </table>
                    </Stack>

                    <Box display='flex' flexDirection='row' justifyContent='space-between'>
                        <Button onClick={() => editAccount(accountDetails.id)} sx={{width:'170px'}} variant='blue'>Edit Account</Button>
                        <Button sx={{width:'170px'}} variant='red'>Delete Account</Button>
                    </Box>
                </Stack>
            </Box>
        </Modal>
        </>
    )
}
