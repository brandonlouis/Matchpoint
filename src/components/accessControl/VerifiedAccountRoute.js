import React from 'react';
import { Navigate } from 'react-router-dom';
import { UserAuth } from '../../config/authContext';

const VerifiedAccountRoute = ({ children }) => {
    const { user } = UserAuth()

    if (!user.email.includes('@matchpoint.com') && !user.emailVerified) {
        return <Navigate to='/' />
    }
    return children
}

export default VerifiedAccountRoute;