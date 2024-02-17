import React from 'react';
import { Navigate } from 'react-router-dom';
import { UserAuth } from '../../config/authContext';

const AdminRoute = ({ children }) => {
    const { user } = UserAuth()

    if (!user || !user.email.includes('@matchpoint.com')) { // Check if user is not logged in or is not an admin
        return <Navigate to='/' />
    }
    return children
}

export default AdminRoute;