pipeline {
    agent any

    environment {
        DOCKER_USER = "seethanveshi"
    }

    stages {

        // ================= DETECT CHANGES =================
        stage('Detect Changes') {
            steps {
                script {

                    def changes = sh(
                        script: """
                        git diff --name-only ${env.GIT_PREVIOUS_SUCCESSFUL_COMMIT ?: 'HEAD~1'} HEAD || echo FIRST_BUILD
                        """,
                        returnStdout: true
                    ).trim()

                    echo "Changed files:\n${changes}"

                    def services = [
                        "service-registry",
                        "auth-service",
                        "group-service",
                        "expense-service",
                        "dashboard-service",
                        "api-gateway"
                    ]

                    def changed = []

                    // FIRST BUILD → build all
                    if (changes.contains("FIRST_BUILD") || !env.GIT_PREVIOUS_SUCCESSFUL_COMMIT) {
                        changed = services
                    } else {

                        // Root-level changes → build all
                        if (changes.contains("pom.xml") || changes.contains("docker-compose.yml")) {
                            changed = services
                        } else {
                            services.each { s ->
                                if (changes.contains(s)) {
                                    changed.add(s)
                                }
                            }
                        }
                    }

                    if (changed.isEmpty()) {
                        echo "No relevant changes detected. Stopping pipeline."
                        error("No services to build")
                    }

                    env.SERVICES = changed.join(',')
                    echo "Services to build: ${env.SERVICES}"
                }
            }
        }

        // ================= DOCKER LOGIN =================
        stage('Docker Login') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'DockerHub',
                    usernameVariable: 'DOCKER_USER_VAR',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh '''
                    echo $DOCKER_PASS | docker login -u $DOCKER_USER_VAR --password-stdin
                    '''
                }
            }
        }

        // ================= PARALLEL BUILD =================
        stage('Build & Push Services') {
            steps {
                script {

                    def services = env.SERVICES.split(',')
                    def parallelStages = [:]

                    services.each { svc ->
                        def service = svc.trim()

                        parallelStages[service] = {

                            stage(service) {
                                dir(service) {

                                    sh '''
                                    set -e
                                    '''

                                    echo "🚀 Processing ${service}"

                                    // Build JAR
                                    sh "mvn clean package -DskipTests"

                                    // Build Docker Image
                                    sh "docker build -t ${service}:${BUILD_NUMBER} ."

                                    // Tag + Push
                                    sh """
                                    docker tag ${service}:${BUILD_NUMBER} ${DOCKER_USER}/${service}:${BUILD_NUMBER}
                                    docker tag ${service}:${BUILD_NUMBER} ${DOCKER_USER}/${service}:latest

                                    docker push ${DOCKER_USER}/${service}:${BUILD_NUMBER}
                                    docker push ${DOCKER_USER}/${service}:latest
                                    """
                                }
                            }
                        }
                    }

                    parallelStages.failFast = true
                    parallel parallelStages
                }
            }
        }
    }

    post {
        success {
            echo "✅ Pipeline completed successfully"
        }
        failure {
            echo "❌ Pipeline failed"
        }
    }
}