declare module 'keycloak-js' {
    interface KeycloakOptions {
        onLoad: string;
        pkceMethod: string;
        scope: string;
        url: string;
        realm: string;
        clientId: string;
    }

    export interface KeycloakInstance {
        init(options: { scope: string; onLoad: string; pkceMethod: string }): Promise<boolean>;
        login(options?: any): Promise<void>;
        logout(options?: any): Promise<void>;
        isAuthenticated(): boolean;
        authenticated?: boolean;
    }

    const Keycloak: (config?: KeycloakOptions) => KeycloakInstance;

    export default Keycloak;
}
