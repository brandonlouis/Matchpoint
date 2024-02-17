import React from 'react';
import { Navigate } from 'react-router-dom';
import { UserAuth } from '../../config/authContext';

const VerifiedAccountRoute = ({ children }) => {
    const { user } = UserAuth()

    if (!user.email.includes('@matchpoint.com') && !user.emailVerified) { // Check if user is not admin and email is not verified
        return <Navigate to='/' />
    }
    return children
}

export default VerifiedAccountRoute;