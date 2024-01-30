import './App.css';
import React from 'react';
import { createTheme, ThemeProvider } from '@mui/material';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthContextProvider } from './config/authContext';
import AdminRoute from './components/accessControl/AdminRoute';
import UserRoute from './components/accessControl/UserRoute';
import TeamLeaderRoute from './components/accessControl/TeamLeaderRoute';
import NoTeamRoute from './components/accessControl/NoTeamRoute';
import VerifiedAccountRoute from './components/accessControl/VerifiedAccountRoute';

import Navbar from './components/Navbar';

// General Users
import Home from './components/Home';
import Tournaments from './components/Tournaments';
import ViewTournament from './components/ViewTournament';
import ViewMatch from './components/ViewMatch';
import NewsArticles from './components/NewsArticles';
import ViewNewsArticle from './components/ViewNewsArticle';
import PlayersTeams from './components/PlayersTeams';
import ViewProfile from './components/ViewProfile';

// Admin
import ManageAccounts from './components/admin/ManageAccounts';
import ManageTournaments from './components/admin/ManageTournaments';
import ManageNewsArticles from './components/admin/ManageNewsArticles';
import ManageSports from './components/admin/ManageSports';

// Registered Users
import ManageAccountProfile from './components/users/ManageAccountProfile';
import CreateTeam from './components/users/CreateTeam';
import ManageTeam from './components/users/ManageTeam';
import MyNewsArticles from './components/users/MyNewsArticles';
import WriteNewsArticle from './components/users/WriteNewsArticle';
import EditNewsArticle from './components/users/EditNewsArticle';
import MyTournaments from './components/users/MyTournaments';
import CreateTournament from './components/users/CreateTournament';
import EditTournament from './components/users/EditTournament';

import Footer from './components/Footer';

const theme = createTheme({
    typography: {
        h1: {
            fontFamily: 'Saira Semi Condensed',
            fontSize: '60px',
            fontWeight: 'bold',
            color: '#222',
            textTransform: 'uppercase',
        },
        h2: {
            fontFamily: 'Saira Semi Condensed',
            fontSize: '30px',
            fontWeight: 'bold',
            color: '#222',
        },
        h3Caps: {
            fontFamily: 'Saira Semi Condensed',
            fontSize: '25px',
            fontWeight: 'bold',
            color: '#222',
            textTransform: 'uppercase',
        },
        h3: {
            fontFamily: 'Saira Semi Condensed',
            fontSize: '25px',
            fontWeight: 'bold',
            color: '#222',
            textTransform: 'uppercase',
            letterSpacing: '5px',
        },
        h4: {
            fontFamily: 'Saira Semi Condensed',
            fontSize: '22px',
            fontWeight: 'bold',
            color: '#222',
        },
        h5: {
            fontFamily: 'Saira Semi Condensed',
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#222',
        },
        body1: {
            fontFamily: 'Saira Semi Condensed',
            fontSize: '18px',
            fontWeight: 'regular',
            color: '#666',
        },
        body2: {
            fontFamily: 'Saira Semi Condensed',
            fontSize: '16px',
            fontWeight: 'regular',
            color: '#666',
        },
        subtitle1: {
            fontFamily: 'Saira Semi Condensed',
            fontSize: '18px',
            fontWeight: '600',
            color: '#222',
        },
        subtitle2: {
            fontFamily: 'Saira Semi Condensed',
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#666',
            textTransform: 'uppercase',
        },
        subtitle3: {
            fontFamily: 'Saira Semi Condensed',
            fontSize: '16px',
            fontWeight: '600',
            color: '#222',
        },
        subtitle4: {
            fontFamily: 'Saira Semi Condensed',
            fontSize: '14px',
            fontWeight: '600',
            color: '#666',
        },
        action: {
            fontFamily: 'Saira Semi Condensed',
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#222',
            textTransform: 'uppercase',
        },
        navDropdown:{
            fontFamily: 'Saira Semi Condensed',
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#666',
            textTransform: 'uppercase',
            marginLeft: '15px',
        },
        footer: {
            fontFamily: 'Saira Semi Condensed',
            fontSize: '16px',
            fontWeight: 'medium',
            color: '#888',
            textTransform: 'uppercase',
        },
        loginSignUp: {
            fontFamily: 'Saira Semi Condensed',
            fontSize: '10px',
            fontWeight: 'bold',
            color: '#666',
            textTransform: 'uppercase',
        },
        smallErrorMsg: {
            fontFamily: 'Saira Semi Condensed',
            fontSize: '12px',
            fontWeight: 'bold',
            color: '#FF0000',
        },
        errorMsg: {
            fontFamily: 'Saira Semi Condensed',
            fontSize: '15px',
            fontWeight: 'bold',
            color: '#FF0000',
        }
    },
    components: {
        MuiButton: {
            variants: [
                {
                    props: { variant: 'red' },
                    style: {
                        fontFamily: 'Saira Semi Condensed',
                        backgroundColor: '#CB3E3E',
                        color: '#FFF',
                        borderRadius: '10px',
                        textTransform: 'uppercase',
                        fontWeight: 'bold',
                        letterSpacing: '1px',
                        padding: '10px 20px',

                        '&:hover': {
                            backgroundColor: '#B53030',
                        },
                        '&:disabled ': {
                            backgroundColor: 'grey',
                            color: 'white',
                            opacity: '0.5',
                        },
                    },
                },
                {
                    props: { variant: 'blue' },
                    style: {
                        fontFamily: 'Saira Semi Condensed',
                        backgroundColor: '#1B82B1',
                        color: '#FFF',
                        borderRadius: '10px',
                        textTransform: 'uppercase',
                        fontWeight: 'bold',
                        letterSpacing: '1px',
                        padding: '10px 20px',

                        '&:hover': {
                            backgroundColor: '#146185',
                        },
                    },
                },
                {
                    props: { variant: 'green' },
                    style: {
                        fontFamily: 'Saira Semi Condensed',
                        backgroundColor: '#36C944',
                        color: '#FFF',
                        borderRadius: '10px',
                        textTransform: 'uppercase',
                        fontWeight: 'bold',
                        letterSpacing: '1px',
                        padding: '10px 20px',
                        height: '45px',
                        width: '60px',

                        '&:hover': {
                            backgroundColor: '#2BA137',
                        },
                        '&:disabled ': {
                            backgroundColor: 'grey',
                            color: 'white',
                            opacity: '0.5',
                        },
                    },
                },
                {
                    props: { variant: 'search' },
                    style: {
                        backgroundColor: '#CB3E3E',
                        color: '#FFF',
                        borderRadius: '0 15px 15px 0',
                        
                        '&:hover': {
                            backgroundColor: '#AA3333',
                        },
                    },
                },
            ]
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    "&.inputTextField": {                        
                        "& .MuiInputBase-root": {
                            fontWeight: 'bold',
                            borderRadius: '15px',
                        },
                        "& .MuiFormLabel-root": {
                            fontFamily: 'Saira Semi Condensed',
                            fontWeight: 'bold',
                            color: '#BBB'
                        },
                        "& .Mui-focused": {
                            borderRadius: '15px',
                        },
                    },
                    "&.newsletterTextField": {
                        backgroundColor: '#FFF',
                        borderRadius: '15px',
                        width:'100%',
                        maxWidth:'500px',
                        height: '45px',

                        "& .MuiInputBase-root": {
                            fontFamily: 'Saira Semi Condensed',
                            fontWeight: 'bold',
                            borderRadius: '15px',
                            height: '45px',
                        },
                        "& .MuiOutlinedInput-input": {
                            height: '12px',
                        },
                        "& .Mui-focused": {
                            borderRadius: '15px',
                            height: '45px',
                        },
                    },
                    "&.loginSignUpTextField": {
                        "& .MuiInputBase-input": {
                            fontFamily: 'Saira Semi Condensed',
                            fontWeight: 'bold',
                        },
                        "& .MuiInputLabel-root": {
                            fontFamily: 'Saira Semi Condensed',
                            fontWeight: 'bold',
                            color: '#BBB'
                        },
                    },
                    "&.searchTextField": {
                        borderRadius: '15px 0 0 15px',
                        width:'200px',
                        height: '45px',
                        backgroundColor: '#FFF',
                        
                        "& .MuiOutlinedInput-input ": {
                            padding: '15px',
                        },
                        "& .MuiInputBase-root": {
                            fontFamily: 'Saira Semi Condensed',
                            fontWeight: 'bold',
                            borderRadius: '15px 0 0 15px',
                            height: '45px',
                        },
                        "& .Mui-focused": {
                            borderRadius: '15px 0 0 15px',
                            height: '45px',
                        },
                    },
                    "&.matchScoreTextField": {
                        width:'100%',
                        backgroundColor: 'white',
                        "& .MuiInputBase-input": {
                            padding: '0 5px',
                        },
                    },
                },
            },
        },
        MuiMenu: {
            styleOverrides: {
                root: {
                    "& .MuiPaper-root": {
                        borderRadius: '0 0 15px 15px',
                        maxHeight: '300px',
                    },
                    "& .MuiList-root": {
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '5px',
                    },
                },
            },
        },
        MuiFormControl: {
            styleOverrides: {
                root: {
                    '&.dropdownList': {
                        '& .MuiOutlinedInput-notchedOutline': {
                            borderRadius: '15px',
                        },
                        '& .MuiFormLabel-root': {
                            fontFamily: 'Saira Semi Condensed',
                            fontWeight: 'bold',
                            color: '#BBB',
                            borderRadius: '15px',
                        },
                    },
                },
            },
        },
        MuiCardContent: {
            styleOverrides: {
                root: {
                    padding: 0,
                    "&:last-child": {
                        paddingBottom: 0
                    }
                },
            },
        },
        MuiTableRow: {
            styleOverrides: {
                root: {
                    "& .MuiTableCell-head": {
                        backgroundColor: '#E4E4E4',
                    },
                    "& .MuiTableCell-root": {
                        textAlign: 'center',
                    },
                    "&:nth-of-type(odd)": {
                        backgroundColor: '#F9F9F9',
                    },
                    '&:nth-of-type(even)': {
                        backgroundColor: '#EEEEEE',
                    },
                    '&:last-child td, &:last-child th': {
                        border: 0,
                    },
                },
            },
        },
        MuiDialog: {
            styleOverrides: {
                root: {
                    "& .MuiDialog-paper": {
                        borderRadius: '15px',
                    },
                    "& .MuiDialogTitle-root": {
                        fontFamily: 'Saira Semi Condensed',
                        fontWeight: 'bold',
                        color: '#222',
                    },
                },
            },
        },
    },
})

function App() {
    return (
        <ThemeProvider theme={theme}>
            <AuthContextProvider>
            <Router>
                <Navbar/>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/Tournaments" element={<Tournaments />} />
                    <Route path="/ViewTournament" element={<ViewTournament />} />
                    <Route path="/ViewMatch" element={<ViewMatch />} />
                    <Route path="/NewsArticles" element={<NewsArticles />} />
                    <Route path="/ViewNewsArticle" element={<ViewNewsArticle />} />
                    <Route path="/PlayersTeams" element={<PlayersTeams />} />
                    <Route path="/ViewProfile" element={<ViewProfile />} />
                    
                    <Route path="/ManageAccounts" element={<AdminRoute><ManageAccounts /></AdminRoute>} />
                    <Route path="/ManageTournaments" element={<AdminRoute><ManageTournaments /></AdminRoute>} />
                    <Route path="/ManageNewsArticles" element={<AdminRoute><ManageNewsArticles /></AdminRoute>} />
                    <Route path="/ManageSports" element={<AdminRoute><ManageSports /></AdminRoute>} />

                    <Route path="/ManageAccountProfile" element={<UserRoute><ManageAccountProfile /></UserRoute>} />
                    <Route path="/CreateTeam" element={<NoTeamRoute><VerifiedAccountRoute><CreateTeam /></VerifiedAccountRoute></NoTeamRoute>} />
                    <Route path="/ManageTeam" element={<TeamLeaderRoute><ManageTeam /></TeamLeaderRoute>} />
                    <Route path="/MyNewsArticles" element={<UserRoute><MyNewsArticles /></UserRoute>} />
                    <Route path="/WriteNewsArticle" element={<UserRoute><VerifiedAccountRoute><WriteNewsArticle /></VerifiedAccountRoute></UserRoute>} />
                    <Route path="/EditNewsArticle" element={<UserRoute><EditNewsArticle /></UserRoute>} />
                    <Route path="/MyTournaments" element={<UserRoute><MyTournaments /></UserRoute>} />
                    <Route path="/CreateTournament" element={<UserRoute><VerifiedAccountRoute><CreateTournament /></VerifiedAccountRoute></UserRoute>} />
                    <Route path="/EditTournament" element={<UserRoute><EditTournament /></UserRoute>} />
                </Routes>
                <Footer/>
            </Router>
            </AuthContextProvider>
        </ThemeProvider>
    );
}

export default App;
