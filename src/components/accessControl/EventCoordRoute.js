import React from 'react';
import { Navigate } from 'react-router-dom';
import { UserAuth } from '../../config/authContext';

const AdminRoute = ({ children }) => {
    const { user } = UserAuth()

    if (!user) { // TODO: Unique identifier for event coord user types
        return <Navigate to='/' />
    }
    return children
}

export default AdminRoute;