import { defineConfig } from '@playwright/test'

export default defineConfig({
    testDir: './e2e', //identifies test folder
    timeout: 60000,   //allows the complete workflow up to 60 seconds
    workers: 1,       //runs one test at a time
 
    use: {
        baseURL: "http://localhost:5173",
        browserName: "chromium",
        trace: "retain-on-failure", //saves debugging information if test fails.
    },
})