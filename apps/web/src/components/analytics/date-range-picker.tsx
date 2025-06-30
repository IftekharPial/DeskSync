'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from 'lucide-react'

interface DateRangePickerProps {
  value: {
    startDate: string
    endDate: string
  }
  onChange: (value: { startDate: string; endDate: string }) => void
}

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [tempRange, setTempRange] = useState(value)

  const handleApply = () => {
    onChange(tempRange)
    setIsOpen(false)
  }

  const handlePreset = (days: number) => {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const newRange = {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    }

    setTempRange(newRange)
    onChange(newRange)
    setIsOpen(false)
  }

  const formatDateRange = () => {
    const start = new Date(value.startDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
    const end = new Date(value.endDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
    return `${start} - ${end}`
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
          <Calendar className="mr-2 h-4 w-4" />
          {formatDateRange()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">Quick Select</h4>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePreset(7)}
              >
                Last 7 days
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePreset(30)}
              >
                Last 30 days
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePreset(90)}
              >
                Last 90 days
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePreset(365)}
              >
                Last year
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Custom Range</h4>
            <div className="space-y-2">
              <div>
                <label className="text-sm font-medium">Start Date</label>
                <Input
                  type="date"
                  value={tempRange.startDate}
                  onChange={(e) =>
                    setTempRange({ ...tempRange, startDate: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">End Date</label>
                <Input
                  type="date"
                  value={tempRange.endDate}
                  onChange={(e) =>
                    setTempRange({ ...tempRange, endDate: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" size="sm" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleApply}>
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
