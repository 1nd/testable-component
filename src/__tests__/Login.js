import Login from '../Login'
import React from 'react';
import { render, fireEvent, wait } from '@testing-library/react'
import axeCore from 'axe-core'
import { loginMutation } from '../api'
import '@testing-library/jest-dom/extend-expect'; // Import toBeInTheDocument, toHaveValue
import '@testing-library/react/cleanup-after-each'
import 'jest-axe/extend-expect' // Import toHaveNoViolations

// Flag to simulate when connection is timeout
let MOCK_TIMEOUT = false;

jest.mock(
    '../api', 
    () => {
        const USERS = [{
            email: 'indra@tokopedia.com',
            password: 'secret',
        }]
        
        return {
            loginMutation: jest.fn(data => {
                
                if (MOCK_TIMEOUT) {
                    return Promise.reject(new Error('Connection time out'))
                }

                const { email, password } = data;

                const loggedInUser = USERS.find(user => {
                    return user.email === email && user.password === password
                });

                return Promise.resolve({
                    username: loggedInUser?.email
                })
            })
        }
    }
)

describe(`Login page`, () => {
    it(`renders empty login form initially`, () => {
        const { getByLabelText } = render(<Login />)
        
        const emailField = getByLabelText('Email')
        expect(emailField).not.toHaveValue()
        
        const passwordField = getByLabelText('Password')
        expect(passwordField).not.toHaveValue()
    })

    it(`is accessible`, () => {
        const { container } = render(<Login />)

        axeCore.run(container, {}, (err, axeResults) => {
            expect(axeResults).toHaveNoViolations()
        })
    })

    it(`displays correct error if form submitted empty`, async () => {
        const { getByText, getByTestId, debug } = render(<Login />)

        const submitButton = getByText('Login')
        fireEvent.click(submitButton);
        // Wait for login submission to finish
        await wait();

        const errorContainer = getByTestId('error')
        expect(errorContainer.innerHTML.match(/Email is required/g)).toEqual(['Email is required'])
        expect(errorContainer.innerHTML.match(/Invalid email/g)).toBeNull()
        expect(errorContainer.innerHTML.match(/Password is required/g)).toEqual(['Password is required'])
    })

    it(`displays correct error if form submitted empty twice`, async () => {
        const { getByText, getByTestId, debug } = render(<Login />)

        const submitButton = getByText('Login')
        fireEvent.click(submitButton);
        // Wait for first submission to finish
        await wait();
        fireEvent.click(submitButton);
        // Wait for second submission to finish
        await wait();

        const errorContainer = getByTestId('error')
        expect(errorContainer.innerHTML.match(/Email is required/g)).toEqual(['Email is required'])
        expect(errorContainer.innerHTML.match(/Invalid email/g)).toBeNull()
        expect(errorContainer.innerHTML.match(/Password is required/g)).toEqual(['Password is required'])
    })

    it(`displays correct error if form submitted without password`, async () => {
        const { getByLabelText, getByText, getByTestId, debug } = render(<Login />)

        const emailField = getByLabelText('Email')
        fireEvent.change(emailField, {target: { value: 'indra@tokopedia.com' }})

        const submitButton = getByText('Login')
        fireEvent.click(submitButton);
        // Wait for login submission to finish
        await wait();

        const errorContainer = getByTestId('error')

        // debug()

        expect(errorContainer.innerHTML.match(/Email is required/g)).toBeNull()
        expect(errorContainer.innerHTML.match(/Invalid email/g)).toBeNull()
        expect(errorContainer.innerHTML.match(/Password is required/g)).toEqual(['Password is required'])
    })

    it(`displays correct error if form submitted without email`, async () => {
        const { getByLabelText, getByText, getByTestId } = render(<Login />)

        const passwordField = getByLabelText('Password')
        fireEvent.change(passwordField, {target: { value: 'secret' }})

        const submitButton = getByText('Login')
        fireEvent.click(submitButton);
        // Wait for login submission to finish
        await wait();

        const errorContainer = getByTestId('error')
        expect(errorContainer.innerHTML.match(/Email is required/g)).toEqual(['Email is required'])
        expect(errorContainer.innerHTML.match(/Invalid email/g)).toBeNull()
        expect(errorContainer.innerHTML.match(/Password is required/g)).toBeNull()
    })

    it(`displays correct error if email is invalid`, async () => {
        const { getByLabelText, getByText, getByTestId } = render(<Login />)

        const emailField = getByLabelText('Email')
        fireEvent.change(emailField, {target: { value: 'indra@' }})

        const submitButton = getByText('Login')
        fireEvent.click(submitButton);
        // Wait for login submission to finish
        await wait();

        const errorContainer = getByTestId('error')
        expect(errorContainer.innerHTML.match(/Email is required/g)).toBeNull()
        expect(errorContainer.innerHTML.match(/Invalid email/g)).toEqual(['Invalid email'])
    })

    it(`logs user in if the email and password matches`, async () => {
        const { getByLabelText, getByText, queryByTestId } = render(<Login />)

        const emailField = getByLabelText('Email')
        const passwordField = getByLabelText('Password')
        fireEvent.change(emailField, { target: { value: 'indra@tokopedia.com' }})
        fireEvent.change(passwordField, { target: { value: 'secret' } })

        const submitButton = getByText('Login')
        fireEvent.click(submitButton)
        // Wait for login submission to finish
        await wait();

        expect(loginMutation).toBeCalledWith({
            email: 'indra@tokopedia.com',
            password: 'secret',
        })

        getByText('Welcome indra@tokopedia.com')

        const loginForm = queryByTestId('login-form')
        expect(loginForm).not.toBeInTheDocument()
    })

    it(`shows error if user try to log in but email doesn't match password`, async () => {
        const {queryByText, getByTestId, getByLabelText, getByText, debug} = render(<Login />)

        const emailField = getByLabelText('Email')
        const passwordField = getByLabelText('Password')
        fireEvent.change(emailField, { target: { value: 'indra@tokopedia.com' }})
        fireEvent.change(passwordField, { target: { value: 's3cret' } })

        const submitButton = getByText('Login')
        fireEvent.click(submitButton)
        // Wait for login submission to finish
        await wait();

        expect(loginMutation).toBeCalledWith({
            email: 'indra@tokopedia.com',
            password: 's3cret',
        })

        const welcome = queryByText('Welcome indra@tokopedia.com')
        expect(welcome).not.toBeInTheDocument()

        getByTestId('login-form')

        const errorContainer = getByTestId('error')
        expect(errorContainer.innerHTML.match(/Email and password do not match/g)).toEqual(['Email and password do not match'])
    })

    it(`clears error if user change email field`, async () => {
        const { getByText, getByTestId, getByLabelText} = render(<Login />)

        const emailField = getByLabelText('Email')
        fireEvent.change(emailField, {target: { value: 'indra@tokopedia.com' }})

        const submitButton = getByText('Login')
        fireEvent.click(submitButton);
        // Wait for login submission to finish
        await wait();

        const errorContainer = getByTestId('error')
        expect(errorContainer).not.toBeEmpty()

        fireEvent.change(emailField, { target: { value: 'in' }})
        expect(errorContainer).toBeEmpty()
    })

    it(`clears error if user focus change password field`, async () => {
        const { getByText, getByTestId, getByLabelText} = render(<Login />)

        const emailField = getByLabelText('Email')
        fireEvent.change(emailField, {target: { value: 'indra@tokopedia.com' }})

        const submitButton = getByText('Login')
        fireEvent.click(submitButton);
        // Wait for login submission to finish
        await wait();

        const errorContainer = getByTestId('error')
        expect(errorContainer).not.toBeEmpty()

        const passwordField = getByLabelText('Password')
        fireEvent.change(passwordField, { target: { value: '12' }})
        expect(errorContainer).toBeEmpty()
    })

    it(`displays error if login mutation throws error`, async () => {
        MOCK_TIMEOUT = true;

        const { getByLabelText, getByText, getByTestId, debug } = render(<Login />)

        const emailField = getByLabelText('Email')
        const passwordField = getByLabelText('Password')
        fireEvent.change(emailField, { target: { value: 'indra@tokopedia.com' }})
        fireEvent.change(passwordField, { target: { value: 'secret' } })

        const submitButton = getByText('Login')
        fireEvent.click(submitButton)
        // Wait for login submission to finish
        await wait();

        const errorContainer = getByTestId('error')
        expect(errorContainer.innerHTML.match(/Connection time out/g)).toEqual(['Connection time out'])

        // Cleanup
        MOCK_TIMEOUT = false;
    })
})