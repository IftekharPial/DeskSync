'use client'

import { useState } from 'react'
import { useMutation } from 'react-query'
import { analyticsApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { downloadFile } from '@/lib/utils'
import { Download, FileText, Table, Loader2 } from 'lucide-react'

interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  dateRange: {
    startDate: string
    endDate: string
  }
}

export function ExportDialog({ open, onOpenChange, dateRange }: ExportDialogProps) {
  const [format, setFormat] = useState<'json' | 'csv'>('csv')
  const { toast } = useToast()

  const exportMutation = useMutation(
    () => analyticsApi.export({ format, ...dateRange }),
    {
      onSuccess: (response) => {
        if (format === 'csv') {
          // Handle blob response for CSV
          const blob = new Blob([response.data], { type: 'text/csv' })
          const url = window.URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `analytics-export-${new Date().toISOString().split('T')[0]}.csv`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          window.URL.revokeObjectURL(url)
        } else {
          // Handle JSON response
          const jsonData = JSON.stringify(response.data, null, 2)
          downloadFile(
            jsonData,
            `analytics-export-${new Date().toISOString().split('T')[0]}.json`,
            'application/json'
          )
        }

        toast({
          title: 'Export Successful',
          description: `Analytics data exported as ${format.toUpperCase()}`,
        })

        onOpenChange(false)
      },
      onError: (error: any) => {
        toast({
          title: 'Export Failed',
          description: error.response?.data?.error || 'Failed to export analytics data',
          variant: 'destructive',
        })
      },
    }
  )

  const handleExport = () => {
    exportMutation.mutate()
  }

  const formatDateRange = () => {
    const start = new Date(dateRange.startDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
    const end = new Date(dateRange.endDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
    return `${start} - ${end}`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Download className="mr-2 h-5 w-5" />
            Export Analytics Data
          </DialogTitle>
          <DialogDescription>
            Export your analytics data for the selected date range
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Date Range Display */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="text-sm font-medium mb-1">Date Range</div>
            <div className="text-sm text-muted-foreground">
              {formatDateRange()}
            </div>
          </div>

          {/* Format Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Export Format</label>
            <Select value={format} onValueChange={(value) => setFormat(value as 'json' | 'csv')}>
              <SelectTrigger>
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">
                  <div className="flex items-center space-x-2">
                    <Table className="h-4 w-4" />
                    <span>CSV (Spreadsheet)</span>
                  </div>
                </SelectItem>
                <SelectItem value="json">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span>JSON (Raw Data)</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Format Description */}
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-sm">
              {format === 'csv' ? (
                <>
                  <strong>CSV Format:</strong> Exports data in a spreadsheet-friendly format that can be opened in Excel, Google Sheets, or other spreadsheet applications.
                </>
              ) : (
                <>
                  <strong>JSON Format:</strong> Exports raw data in JSON format, suitable for developers and data analysis tools.
                </>
              )}
            </div>
          </div>

          {/* Data Included */}
          <div className="space-y-2">
            <div className="text-sm font-medium">Data Included</div>
            <div className="text-sm text-muted-foreground space-y-1">
              <div>• Daily reports and performance metrics</div>
              <div>• Meeting reports and outcomes</div>
              <div>• User activity and statistics</div>
              <div>• Time-based performance trends</div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={exportMutation.isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={exportMutation.isLoading}
          >
            {exportMutation.isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export {format.toUpperCase()}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
