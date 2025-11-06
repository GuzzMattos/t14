import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthNav from './AuthNavigator';
import MainTabs from './MainTabs';
import { useAuth } from '@/contexts/AuthContext';
import ChangePassword from '@/screens/profile/ChangePasswordScreen';
import EditProfile from '@/screens/profile/EditProfileScreen';
import colors from '@/theme/colors';

export type RootStackParamList = {
    Auth: undefined;
    Main: undefined;
    ChangePassword: undefined;
    EditProfile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
    const { user } = useAuth();

    return (
        <NavigationContainer>
            <Stack.Navigator
                screenOptions={{
                    headerShown: true,             
                    headerTitleAlign: 'center',
                    headerTintColor: colors.textDark,
                    headerStyle: { backgroundColor: '#fff' },
                    headerShadowVisible: true,      
                    headerBackVisible: true,      
                    headerBackButtonDisplayMode: 'minimal', //ocultar texto do botão voltar para iOS  
                }}
            >
                {user ? (
                    <>
                        <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
                        <Stack.Screen name="ChangePassword" component={ChangePassword} options={{ title: 'Alterar Password' }} />
                        <Stack.Screen name="EditProfile" component={EditProfile} options={{ title: 'Perfil' }} />
                    </>
                ) : (
                    <Stack.Screen name="Auth" component={AuthNav} options={{ headerShown: false }} />
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}
