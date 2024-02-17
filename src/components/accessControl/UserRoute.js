import React from 'react';
import { Navigate } from 'react-router-dom';
import { UserAuth } from '../../config/authContext';

const UserRoute = ({ children }) => {
    const { user } = UserAuth()

    if (!user) { // Check if user is not logged in
        return <Navigate to='/' />
    }
    return children
}

export default UserRoute;