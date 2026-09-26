pipeline {
    agent any

    // Requires a NodeJS installation named exactly "NodeJS" configured under
    // Manage Jenkins > Tools (see the setup guide). This puts node/npm on the
    // PATH for every stage below, regardless of what account the Jenkins
    // service itself runs as.
    tools {
        nodejs 'NodeJS'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Backend Dependencies') {
            steps {
                dir('backend') {
                    script {
                        if (isUnix()) {
                            sh 'npm install'
                        } else {
                            bat 'npm install'
                        }
                    }
                }
            }
        }

        stage('Run Backend Tests') {
            steps {
                dir('backend') {
                    script {
                        if (isUnix()) {
                            sh 'npm test'
                        } else {
                            bat 'npm test'
                        }
                    }
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    if (isUnix()) {
                        sh "docker build -t booking-management-system:latest -t booking-management-system:${env.BUILD_NUMBER} ."
                    } else {
                        bat "docker build -t booking-management-system:latest -t booking-management-system:${env.BUILD_NUMBER} ."
                    }
                }
            }
        }

        // Pushing the image to Docker Hub and deploying it get added here in Phase 7.
    }

    post {
        success {
            echo 'Build and tests passed.'
        }
        failure {
            echo 'Build or tests failed - check the stage logs above.'
        }
        always {
            echo 'Pipeline finished.'
        }
    }
}
