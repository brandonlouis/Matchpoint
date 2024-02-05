import React, { useEffect, useState } from 'react'
import { Box, Button, Card, CardActionArea, CardContent, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Grid, Modal, Stack, TextField, Typography } from '@mui/material'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { db } from '../../config/firebase';
import { getDocs, getDoc, doc, collection, query, orderBy, deleteDoc } from 'firebase/firestore';
import axios from 'axios';
import { useMediaQuery } from 'react-responsive';

export default function ManageAccounts() {
    const isTablet = useMediaQuery({ query: '(max-width: 1020px)' })
    const isMobile = useMediaQuery({ query: '(max-width: 600px)' })

    const [openModal, setOpenModal] = useState(false)
    const [openConfirmation, setOpenConfirmation] = useState(false)

    const [accountsList, setAccountsList] = useState([])
    const [accountDetails, setAccountDetails] = useState({})

    const [searchCriteria, setSearchCriteria] = useState('')


    useEffect(() => { // Handle retrieving account list on initial load
        const getAccounts = async () => {
            try {
                const q = query(collection(db, 'accounts'), orderBy('username'))
                const data = await getDocs(q)
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

    const deleteAccount = async (id) => {
        try {
            await axios.post('http://localhost/deleteUser', { id })
            await deleteDoc(doc(db, 'accounts', id))
            await deleteDoc(doc(db, 'profiles', id))
            alert('Account deleted successfully')
            window.location.reload()
          } catch (err) {
            console.error(err.message)
          }
    }

    const searchAccount = async (e) => { // Handle search record
        e.preventDefault()
        try {
            const q = query(collection(db, 'accounts'), orderBy('username'))
            const data = await getDocs(q)
            const resList = data.docs.map((doc) => ({...doc.data(), id: doc.id})).filter(account => account.type !== 'admin' && (account.username.includes(searchCriteria.toLowerCase()) || account.fullName.includes(searchCriteria.toLowerCase())))
            
            setAccountsList(resList)
        } catch (err) {
            console.error(err)
        }
    }

    
    return (
        <>
        <Box height='100%' width='100%' minHeight='280px' padding={isMobile ? '120px 0 150px' : isTablet ? '150px 0 150px' : '185px 0 150px'} display='flex' justifyContent='center'>
            <Stack width={isMobile || isTablet ? '90%' : '80%'}>
                {isMobile ?
                    <Stack gap='25px'>
                        <Typography variant='h3'>Manage Accounts</Typography>
                        <Box>
                            <form style={{display:'flex'}} onSubmit={searchAccount}>
                                <TextField className='searchTextField' sx={{width:'100% !important'}} placeholder='SEARCH' onChange={(e) => setSearchCriteria(e.target.value)}/>
                                <Button variant='search' type='submit'><SearchRoundedIcon sx={{fontSize:'30px'}}/></Button>
                            </form>
                        </Box>
                    </Stack>
                    :
                    <Box display='flex' justifyContent='space-between' alignItems='center'>
                        <Typography variant='h3'>Manage Accounts</Typography>
                        <Box>
                            <form style={{display:'flex'}} onSubmit={searchAccount}>
                                <TextField className='searchTextField' placeholder='SEARCH' onChange={(e) => setSearchCriteria(e.target.value)}/>
                                <Button variant='search' type='submit'><SearchRoundedIcon sx={{fontSize:'30px'}}/></Button>
                            </form>
                        </Box>
                    </Box>
                }
                {accountsList.length === 0 ?
                    <Stack height='150px' marginTop='50px' alignItems='center' justifyContent='center'>
                        <Typography variant='h5'>No results found</Typography>
                    </Stack>
                    :
                    <Grid container gap='35px' alignItems='stretch' marginTop='50px'>
                        {accountsList.map((account) => (
                            <Grid key={account.id} item width='150px' borderRadius='15px' boxShadow='0 5px 15px rgba(0, 0, 0, 0.2)'>
                                <Card sx={{bgcolor:'#EEE', textAlign:'center', height:'150px', borderRadius:'15px'}} >
                                    <CardActionArea sx={{height:'150px'}} onClick={() => viewAccount(account.id)}>
                                        <CardContent sx={{margin:'16px', overflow:'hidden'}}>
                                            <Typography variant='h5'>@{account.username}</Typography>
                                            <Typography textTransform='capitalize' variant='subtitle4'>{account.fullName}</Typography>
                                        </CardContent>
                                    </CardActionArea>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                }
            </Stack>
        </Box>

        <Modal open={openModal} onClose={() => setOpenModal(false)} disableScrollLock>
            <Box className='ModalView' display='flex' borderRadius='20px' width='80%' maxWidth='400px' padding={isMobile ? '20px' : '50px'} margin='120px auto' bgcolor='#EEE' justifyContent='center' alignItems='center'>
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
                                <tr>
                                    <td>
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
                                        <Typography variant='subtitle2'>Email:</Typography>
                                    </td>
                                    <td>
                                        <Typography variant='subtitle3'>{accountDetails.email}</Typography>
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

                    <Button onClick={() => setOpenConfirmation(true)} variant='red' fullWidth>Delete Account</Button>
                </Stack>
            </Box>
        </Modal>

        <React.Fragment>
            <Dialog open={openConfirmation} onClose={() => setOpenConfirmation(false)}>
                <DialogTitle>
                    Delete Account
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete this account?
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{padding:'0 24px 16px'}}>
                    <Button onClick={() => deleteAccount(accountDetails.id)} variant='blue'>Yes</Button>
                    <Button onClick={() => setOpenConfirmation(false)} variant='red' autoFocus>No</Button>
                </DialogActions>
            </Dialog>
        </React.Fragment>
        </>
    )
}
