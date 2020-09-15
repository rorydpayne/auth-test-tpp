import React, {FunctionComponent, useCallback, useEffect, useState} from 'react';
import {Auth0DecodedHash, Auth0Error, WebAuth} from "auth0-js";
import qs from 'qs';


interface AppState {
    loading: boolean,
    authenticated: boolean | null
    token?: string
}

interface AuthParams {
    access_token?: string,
    id_token?: string,
    error?: string
}

const App: FunctionComponent<any> = () => {

    const [state, setState] = useState<AppState>({
        loading: true,
        authenticated: null
    });

    const webAuth = new WebAuth({
        domain: process.env.REACT_APP_AUTH_DOMAIN!,
        clientID: process.env.REACT_APP_CLIENT_ID!,
        scope: process.env.REACT_APP_SCOPE!,
        responseType: 'id_token token',
        redirectUri: process.env.REACT_APP_PUBLIC_URL!,
        jwksURI: `https://${process.env.REACT_APP_AUTH_DOMAIN}/oauth/.well-known/openid-configuration/jwks`,
        overrides: {
            __token_issuer: `https://${process.env.REACT_APP_AUTH_DOMAIN}/oauth`
        }
    });

    const handleAuthParams = useCallback(() => {
        const queryParams = qs.parse(window.location.hash, {ignoreQueryPrefix: true}) as AuthParams;
        webAuth.parseHash((error: null | Auth0Error, decoded: null | Auth0DecodedHash) => {
            setState({
                authenticated: error === null,
                loading: false,
                token: decoded?.accessToken
            });
        });

        setState({
            authenticated: true,
            loading: false,
            token: queryParams.access_token
        });
        window.location.hash = '';
    }, [webAuth, setState]);

    const checkAuth = useCallback(() => {
        webAuth.renewAuth({
            redirectUri: `${process.env.REACT_APP_PUBLIC_URL}/pm_cb.html`,
        }, (error: null | Auth0Error, result: any) => {
            setState({
                authenticated: !error,
                loading: false,
                token: !!result ? result.accessToken : undefined
            });
        });
    }, [webAuth, setState]);

    useEffect(() => {
        if (window.location.hash.indexOf("access_token") >= 0) {
            handleAuthParams();
        } else if (state.authenticated === null) {
            checkAuth();
        }
    }, [state, handleAuthParams, checkAuth]);

    const login = () => webAuth.authorize();

    const logout = () => webAuth.logout({returnTo: process.env.REACT_APP_PUBLIC_URL!});

    const silentLogin = () => webAuth.renewAuth({
        redirectUri: `${process.env.REACT_APP_PUBLIC_URL}/pm_cb.html`
    }, (error: null | Auth0Error, result: any) => {
        setState({
            authenticated: !error,
            loading: false,
            token: !!result ? result.accessToken : undefined
        });
    });

    if (state.loading) {
        return (<div>Loading...</div>);
    }
    if (state.authenticated) {
        return (<div>
            <p>Logged In</p>
            <button onClick={logout}>Log Out</button>
            <span> </span>
            <button onClick={silentLogin}>Silent Login</button>
            <p>token: {state.token}</p>
        </div>);
    }
    return <button onClick={login}>Login</button>;
};

export default App;
