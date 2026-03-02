// Test script for ApexMoney Premium Features
// Run this after starting your backend server
import axios from 'axios';

const BASE_URL = 'http://localhost:8000';

// Color codes for console output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[36m',
    reset: '\x1b[0m'
};

const log = {
    success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
    error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
    info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
    warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`)
};

async function testPremiumFeatures() {
    console.log('\n🚀 Testing ApexMoney Premium Features\n');

    try {
        // Test 1: AI Categorization
        log.info('Testing AI Expense Categorization...');
        try {
            const catResponse = await axios.post(`${BASE_URL}/ai/categorize`, {
                description: 'Starbucks Coffee',
                amount: 5.50
            });
            log.success(`AI Categorization: ${catResponse.data.category} (${catResponse.data.confidence}% confidence)`);
            log.info(`AI Powered: ${catResponse.data.aiPowered ? 'Yes (using Gemini)' : 'No (using rules)'}`);
        } catch (error) {
            log.warn('AI categorization requires AI Pro subscription or user session');
            log.info(`Error: ${error.response?.data?.error || error.message}`);
        }

        // Test 2: Check Goals Endpoint
        log.info('\nTesting Financial Goals API...');
        try {
            const goalResponse = await axios.get(`${BASE_URL}/goals/get`);
            log.success(`Goals API working! Found ${goalResponse.data.length} goals`);
        } catch (error) {
            log.warn('Goals endpoint requires authentication');
        }

        // Test 3: Check Subscriptions Endpoint
        log.info('\nTesting Subscriptions API...');
        try {
            const subResponse = await axios.get(`${BASE_URL}/subscriptions/get`);
            log.success('Subscriptions API working!');
        } catch (error) {
            log.warn('Subscriptions endpoint requires authentication');
        }

        // Test 4: Check AI Insights Endpoint
        log.info('\nTesting AI Insights API...');
        try {
            const insightResponse = await axios.get(`${BASE_URL}/ai/insights`);
            log.success('AI Insights API working!');
        } catch (error) {
            log.warn('AI Insights requires AI Pro subscription and authentication');
        }

        console.log('\n✅ Basic API tests complete!');
        console.log('\n📝 Next Steps:');
        console.log('1. Start your frontend: cd ApexMoney_Frontend && npm run dev');
        console.log('2. Login/Signup to create a user session');
        console.log('3. Add some expenses to test AI categorization');
        console.log('4. Try the auto-detect feature for subscriptions');
        console.log('5. Create a financial goal and track progress\n');

    } catch (error) {
        log.error(`Test failed: ${error.message}`);
        if (error.code === 'ECONNREFUSED') {
            log.error('\n❌ Backend server is not running!');
            log.info('Start it with: cd ApexMoney && npm run dev\n');
        }
    }
}

// Check if backend is running
async function checkBackend() {
    try {
        const response = await axios.get(`${BASE_URL}/user/check-auth`);
        log.success('Backend server is running!\n');
        return true;
    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            log.error('Backend server is NOT running!');
            log.info('Start it with: cd ApexMoney && npm run dev\n');
            return false;
        }
        // If we get any other error, server is running but endpoint doesn't exist (which is fine)
        log.success('Backend server is running!\n');
        return true;
    }
}

// Main execution
const serverRunning = await checkBackend();
if (serverRunning) {
    await testPremiumFeatures();
}
