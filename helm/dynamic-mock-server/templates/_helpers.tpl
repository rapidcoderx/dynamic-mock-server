{{/*
Expand the name of the chart.
*/}}
{{- define "dynamic-mock-server.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "dynamic-mock-server.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "dynamic-mock-server.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "dynamic-mock-server.labels" -}}
helm.sh/chart: {{ include "dynamic-mock-server.chart" . }}
{{ include "dynamic-mock-server.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "dynamic-mock-server.selectorLabels" -}}
app.kubernetes.io/name: {{ include "dynamic-mock-server.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "dynamic-mock-server.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "dynamic-mock-server.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Create the configmap name
*/}}
{{- define "dynamic-mock-server.configmapName" -}}
{{- printf "%s-config" (include "dynamic-mock-server.fullname" .) }}
{{- end }}

{{/*
Create the secret name
*/}}
{{- define "dynamic-mock-server.secretName" -}}
{{- printf "%s-secrets" (include "dynamic-mock-server.fullname" .) }}
{{- end }}

{{/*
Database URL for MongoDB
*/}}
{{- define "dynamic-mock-server.mongodbUrl" -}}
{{- if .Values.config.database.mongodb.uri }}
{{- .Values.config.database.mongodb.uri }}
{{- else }}
{{- printf "mongodb://localhost:27017/%s" .Values.config.database.mongodb.database }}
{{- end }}
{{- end }}

{{/*
PostgreSQL connection string
*/}}
{{- define "dynamic-mock-server.postgresqlUrl" -}}
{{- if and .Values.config.database.postgresql.host .Values.config.database.postgresql.username .Values.config.database.postgresql.password }}
{{- printf "postgresql://%s:%s@%s:%d/%s" .Values.config.database.postgresql.username .Values.config.database.postgresql.password .Values.config.database.postgresql.host (.Values.config.database.postgresql.port | int) .Values.config.database.postgresql.database }}
{{- else }}
{{- printf "postgresql://localhost:5432/%s" .Values.config.database.postgresql.database }}
{{- end }}
{{- end }}
