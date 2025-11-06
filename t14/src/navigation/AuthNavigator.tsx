import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Login from '@/screens/auth/LoginScreen';
import Register from '@/screens/auth/RegisterScreen';
import Verify from '@/screens/auth/VerifyCodeScreen';
import Reset from '@/screens/auth/ResetPasswordScreen';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  VerifyCode: { email: string };
  ResetPassword: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerTitleAlign: 'center',
        headerBackVisible: true,
      }}
    >
      <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
      <Stack.Screen name="Register" component={Register} options={{ title: 'Registo' }} />
      <Stack.Screen name="VerifyCode" component={Verify} options={{ title: 'Verifique o seu email' }} />
      <Stack.Screen name="ResetPassword" component={Reset} options={{ title: 'Redefinir palavra-passe' }} />
    </Stack.Navigator>
  );
}
